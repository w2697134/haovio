import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  encryptSensitiveText,
  normalizeCardCode,
  productTierKey,
  serializeCookieMeta,
  validateChatGptCookieJson,
} from "@/lib/cardRedeem";

const schema = z
  .object({
    code: z.string().trim().min(4, "请输入卡密").max(64, "卡密过长"),
    contactQq: z.string().trim().max(40, "QQ 过长").optional(),
    contactWechat: z.string().trim().max(80, "微信过长").optional(),
    expectedProductType: z.string().trim().max(80, "卡密类型过长").optional(),
    cookieJson: z.string().trim().min(2, "请粘贴 edit-cookie JSON"),
  })
  .refine((data) => Boolean(data.contactQq || data.contactWechat), {
    message: "QQ 和微信至少填写一个",
    path: ["contactQq"],
  });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const code = normalizeCardCode(data.code);
  const cookieCheck = validateChatGptCookieJson(data.cookieJson);
  if (!cookieCheck.ok || !cookieCheck.header || !cookieCheck.normalizedJson) {
    return NextResponse.json(
      { error: cookieCheck.error ?? "Cookie JSON 检测未通过", meta: cookieCheck.meta },
      { status: 400 }
    );
  }
  const cookieHeader = cookieCheck.header;

  const card = await prisma.cardCode.findUnique({
    where: { code },
    include: { redeem: { select: { id: true } } },
  });

  if (!card) {
    return NextResponse.json({ error: "卡密不存在" }, { status: 404 });
  }
  if (card.expiresAt && card.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "卡密已过期" }, { status: 400 });
  }
  if (card.status !== "UNUSED" || card.redeem) {
    return NextResponse.json({ error: "卡密已使用或已提交" }, { status: 409 });
  }
  const expectedTier = productTierKey(data.expectedProductType);
  const cardTier = productTierKey(card.productType);
  if (expectedTier && cardTier && expectedTier !== cardTier) {
    return NextResponse.json(
      { error: "卡密类型不匹配，请回到对应商品页面提交" },
      { status: 400 }
    );
  }

  const redeem = await prisma.$transaction(async (tx) => {
    const created = await tx.cardRedeem.create({
      data: {
        cardId: card.id,
        contactQq: data.contactQq || null,
        contactWechat: data.contactWechat || null,
        cookieJsonCipher: encryptSensitiveText(data.cookieJson),
        cookieHeaderCipher: encryptSensitiveText(cookieHeader),
        cookieMeta: serializeCookieMeta(cookieCheck.meta),
      },
      select: { id: true },
    });
    await tx.cardCode.update({
      where: { id: card.id },
      data: { status: "SUBMITTED", usedAt: new Date() },
    });
    return created;
  });

  return NextResponse.json({
    ok: true,
    id: redeem.id,
    productType: card.productType,
    cookieMeta: cookieCheck.meta,
  });
}
