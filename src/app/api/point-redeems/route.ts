import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  encryptSensitiveText,
  serializeCookieMeta,
  validateChatGptCookieJson,
} from "@/lib/cookieTools";
import { prisma } from "@/lib/db";
import { pointsForPrice } from "@/lib/points";

const schema = z
  .object({
    variantId: z.string().min(1, "请选择商品"),
    contactQq: z.string().trim().max(40, "QQ 过长").optional(),
    contactWechat: z.string().trim().max(80, "微信过长").optional(),
    deliveryMode: z.enum(["COOKIE", "MANUAL"]).default("MANUAL"),
    cookieJson: z.string().trim().optional(),
    cookieAccount: z
      .object({
        email: z.string().trim().max(120).nullable().optional(),
        name: z.string().trim().max(120).nullable().optional(),
        id: z.string().trim().max(120).nullable().optional(),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.contactQq || data.contactWechat), {
    message: "QQ 和微信至少填写一个",
    path: ["contactQq"],
  })
  .refine((data) => data.deliveryMode === "MANUAL" || Boolean(data.cookieJson && data.cookieJson.length >= 2), {
    message: "个人直充请提交 Session",
    path: ["cookieJson"],
  });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const data = parsed.data;
  const variant = await prisma.productVariant.findUnique({
    where: { id: data.variantId },
    include: { product: true },
  });
  if (!variant || variant.product.status !== "ACTIVE") {
    return NextResponse.json({ error: "商品不存在或已下架" }, { status: 404 });
  }

  const pointsCost = pointsForPrice(variant.price);
  const isSharedProduct = variant.product.slug.includes("shared");
  if (isSharedProduct && data.deliveryMode !== "MANUAL") {
    return NextResponse.json({ error: "合租号无需 Session，请走人工交付" }, { status: 400 });
  }

  const isManualDelivery = data.deliveryMode === "MANUAL";
  const cookieCheck = isManualDelivery ? null : validateChatGptCookieJson(data.cookieJson ?? "");
  if (!isManualDelivery && (!cookieCheck?.ok || !cookieCheck.header || !cookieCheck.normalizedJson)) {
    return NextResponse.json(
      { error: cookieCheck?.error ?? "Session 检测未通过", meta: cookieCheck?.meta },
      { status: 400 }
    );
  }

  const cookieHeader = cookieCheck?.header ?? "";
  const cookieMeta = cookieCheck?.meta ?? {
    count: 0,
    domains: [],
    totalValueChars: 0,
    formatStatus: "VALID_FORMAT" as const,
    issues: [],
    deliveryMode: "MANUAL" as const,
  };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const paid = await tx.user.updateMany({
        where: { id: user.id, pointsBalance: { gte: pointsCost } },
        data: { pointsBalance: { decrement: pointsCost } },
      });
      if (paid.count !== 1) throw new Error("INSUFFICIENT_POINTS");

      const updatedUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { pointsBalance: true },
      });
      if (!updatedUser) throw new Error("USER_NOT_FOUND");

      const redeem = await tx.pointRedeem.create({
        data: {
          userId: user.id,
          variantId: variant.id,
          productName: variant.product.name,
          variantName: variant.name,
          pointsCost,
          contactQq: data.contactQq || null,
          contactWechat: data.contactWechat || null,
          deliveryMode: data.deliveryMode,
          accountInfo: JSON.stringify({
            deliveryMode: data.deliveryMode,
            cookieAccount: isManualDelivery ? null : data.cookieAccount ?? null,
          }),
          cookieJsonCipher: encryptSensitiveText(isManualDelivery ? "人工交付" : data.cookieJson ?? ""),
          cookieHeaderCipher: encryptSensitiveText(cookieHeader),
          cookieMeta: serializeCookieMeta({
            ...cookieMeta,
            deliveryMode: isManualDelivery ? "MANUAL" : "COOKIE",
          }),
          adminNote: isManualDelivery ? "人工交付" : null,
        },
        select: { id: true },
      });

      await tx.pointLedger.create({
        data: {
          userId: user.id,
          type: "PRODUCT_REDEEM",
          amount: -pointsCost,
          balanceAfter: updatedUser.pointsBalance,
          refType: "PointRedeem",
          refId: redeem.id,
          note: `${variant.product.name} ${variant.name}`,
        },
      });

      return { redeem, balance: updatedUser.pointsBalance };
    });

    return NextResponse.json({
      ok: true,
      id: result.redeem.id,
      balance: result.balance,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
      return NextResponse.json({ error: "余额不足" }, { status: 400 });
    }
    throw error;
  }
}
