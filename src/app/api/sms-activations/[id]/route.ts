import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelFiveSimOrder, checkFiveSimOrder, extractSmsCode, finishFiveSimOrder } from "@/lib/fiveSim";

const patchSchema = z.object({
  action: z.enum(["cancel", "finish"]),
});

type SmsActivationRouteContext = {
  params: Promise<{ id: string }>;
};

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

async function refundActiveOrder(order: { id: string; userId: string; pointsCost: number; status: string }) {
  if (!["BUYING", "ACTIVE"].includes(order.status)) return null;

  return prisma.$transaction(async (tx) => {
    const current = await tx.smsActivationOrder.findUnique({ where: { id: order.id } });
    if (!current || !["BUYING", "ACTIVE"].includes(current.status)) return current;

    const updatedUser = await tx.user.update({
      where: { id: order.userId },
      data: { pointsBalance: { increment: order.pointsCost } },
      select: { pointsBalance: true },
    });

    const updatedOrder = await tx.smsActivationOrder.update({
      where: { id: order.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await tx.pointLedger.create({
      data: {
        userId: order.userId,
        type: "REFUND",
        amount: order.pointsCost,
        balanceAfter: updatedUser.pointsBalance,
        refType: "SmsActivationOrder",
        refId: order.id,
        note: "接码订单取消退款",
      },
    });

    return updatedOrder;
  });
}

async function loadOrder(id: string, userId: string) {
  return prisma.smsActivationOrder.findFirst({
    where: { id, userId },
  });
}

export async function GET(_req: Request, ctx: SmsActivationRouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await ctx.params;
  const order = await loadOrder(id, user.id);
  if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

  if (order.status === "ACTIVE" && order.providerOrderId && !order.smsCode) {
    try {
      const fiveSimOrder = await checkFiveSimOrder(order.providerOrderId);
      const sms = extractSmsCode(fiveSimOrder);
      if (sms.code) {
        const updated = await prisma.smsActivationOrder.update({
          where: { id: order.id },
          data: {
            status: "RECEIVED",
            smsCode: sms.code,
            smsText: sms.text,
            providerPayload: JSON.stringify(fiveSimOrder),
          },
        });
        return NextResponse.json({ ok: true, order: publicOrder(updated) });
      }

      const providerStatus = fiveSimOrder.status?.toUpperCase();
      if (providerStatus === "CANCELED" || providerStatus === "BANNED") {
        const updated = await prisma.smsActivationOrder.update({
          where: { id: order.id },
          data: { status: "CANCELLED", providerPayload: JSON.stringify(fiveSimOrder), cancelledAt: new Date() },
        });
        return NextResponse.json({ ok: true, order: publicOrder(updated) });
      }
    } catch {
      return NextResponse.json({ ok: true, order: publicOrder(order) });
    }
  }

  if (order.status === "ACTIVE" && order.expiresAt && order.expiresAt <= new Date()) {
    const updated = await prisma.smsActivationOrder.update({
      where: { id: order.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ ok: true, order: publicOrder(updated) });
  }

  return NextResponse.json({ ok: true, order: publicOrder(order) });
}

export async function PATCH(req: Request, ctx: SmsActivationRouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await ctx.params;
  const order = await loadOrder(id, user.id);
  if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  if (parsed.data.action === "cancel") {
    if (order.providerOrderId && order.status === "ACTIVE") {
      await cancelFiveSimOrder(order.providerOrderId).catch(() => null);
    }
    const updated = await refundActiveOrder(order);
    return NextResponse.json({ ok: true, order: updated ? publicOrder(updated) : publicOrder(order) });
  }

  if (order.providerOrderId) {
    await finishFiveSimOrder(order.providerOrderId).catch(() => null);
  }
  const updated = await prisma.smsActivationOrder.update({
    where: { id: order.id },
    data: { status: "FINISHED", completedAt: new Date() },
  });
  return NextResponse.json({ ok: true, order: publicOrder(updated) });
}
