import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buyFiveSimActivation, extractSmsCode } from "@/lib/fiveSim";
import { pointsForPrice } from "@/lib/points";
import {
  isSmsActivationCountry,
  isSmsActivationOperator,
  isSmsActivationService,
} from "@/lib/smsActivationOptions";

const schema = z.object({
  variantId: z.string().min(1, "请选择商品"),
  serviceCode: z.string().default("openai"),
  countryCode: z.string().default("vietnam"),
  operatorCode: z.string().default("any"),
});

function publicOrder(order: {
  id: string;
  status: string;
  phone: string | null;
  smsCode: string | null;
  smsText: string | null;
  expiresAt: Date | null;
  pointsCost: number;
  serviceCode: string;
  countryCode: string;
  operatorCode: string;
}) {
  return {
    id: order.id,
    status: order.status,
    phone: order.phone,
    smsCode: order.smsCode,
    smsText: order.smsText,
    expiresAt: order.expiresAt?.toISOString() ?? null,
    pointsCost: order.pointsCost,
    serviceCode: order.serviceCode,
    countryCode: order.countryCode,
    operatorCode: order.operatorCode,
  };
}

async function refundSmsOrder(orderId: string, userId: string, pointsCost: number, reason: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.smsActivationOrder.findUnique({ where: { id: orderId } });
    if (!current || current.status !== "BUYING") return current;

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { pointsBalance: { increment: pointsCost } },
      select: { pointsBalance: true },
    });

    const updatedOrder = await tx.smsActivationOrder.update({
      where: { id: orderId },
      data: { status: "FAILED", error: reason },
    });

    await tx.pointLedger.create({
      data: {
        userId,
        type: "REFUND",
        amount: pointsCost,
        balanceAfter: updatedUser.pointsBalance,
        refType: "SmsActivationOrder",
        refId: orderId,
        note: "接码下单失败自动退款",
      },
    });

    return updatedOrder;
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: parsed.data.variantId },
    include: { product: true },
  });
  if (!variant || variant.product.status !== "ACTIVE" || variant.product.slug !== "sms-activation") {
    return NextResponse.json({ error: "接码商品不存在或已下架" }, { status: 404 });
  }
  if (
    !isSmsActivationService(parsed.data.serviceCode) ||
    !isSmsActivationCountry(parsed.data.countryCode) ||
    !isSmsActivationOperator(parsed.data.operatorCode)
  ) {
    return NextResponse.json({ error: "接码国家或服务暂不支持" }, { status: 400 });
  }

  const pointsCost = pointsForPrice(variant.price);
  const created = await prisma.$transaction(async (tx) => {
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

    const order = await tx.smsActivationOrder.create({
      data: {
        userId: user.id,
        variantId: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        pointsCost,
        serviceCode: parsed.data.serviceCode,
        countryCode: parsed.data.countryCode,
        operatorCode: parsed.data.operatorCode,
      },
    });

    await tx.pointLedger.create({
      data: {
        userId: user.id,
        type: "PRODUCT_REDEEM",
        amount: -pointsCost,
        balanceAfter: updatedUser.pointsBalance,
        refType: "SmsActivationOrder",
        refId: order.id,
        note: `${variant.product.name} ${variant.name}`,
      },
    });

    return order;
  }).catch((error) => {
    if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") return null;
    throw error;
  });

  if (!created) {
    return NextResponse.json({ error: "余额不足" }, { status: 400 });
  }

  try {
    const fiveSimOrder = await buyFiveSimActivation({
      country: created.countryCode,
      operator: created.operatorCode,
      product: created.serviceCode,
    });
    const sms = extractSmsCode(fiveSimOrder);
    const expiresAt = fiveSimOrder.expires ? new Date(fiveSimOrder.expires) : null;
    const status = sms.code ? "RECEIVED" : "ACTIVE";

    const updated = await prisma.smsActivationOrder.update({
      where: { id: created.id },
      data: {
        status,
        providerOrderId: String(fiveSimOrder.id),
        phone: fiveSimOrder.phone ?? null,
        smsCode: sms.code,
        smsText: sms.text,
        providerPayload: JSON.stringify(fiveSimOrder),
        expiresAt,
      },
    });

    return NextResponse.json({ ok: true, order: publicOrder(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "5SIM 下单失败";
    const refunded = await refundSmsOrder(created.id, user.id, pointsCost, message);
    return NextResponse.json(
      { error: message === "FIVESIM_NOT_CONFIGURED" ? "5SIM 密钥未配置" : "自动买号失败，余额已退回", order: refunded ? publicOrder(refunded) : null },
      { status: 502 }
    );
  }
}
