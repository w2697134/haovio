import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  orderId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const user = await getCurrentUser();
  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }
  if (order.userId && (!user || (order.userId !== user.id && user.role !== "ADMIN"))) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  if (order.status !== "PENDING_PAYMENT" && order.status !== "PENDING") {
    return NextResponse.json({ ok: true, status: order.status });
  }

  const payment = order.payments[0];
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: "MANUAL_PLACEHOLDER",
      },
    });

    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          provider: "MANUAL_PLACEHOLDER",
          status: "SUCCEEDED",
          externalId: `placeholder-${order.orderNo}`,
          raw: JSON.stringify({ mode: "placeholder", confirmedAt: new Date().toISOString() }),
        },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "MANUAL_PLACEHOLDER",
          status: "SUCCEEDED",
          externalId: `placeholder-${order.orderNo}`,
          amount: order.totalAmount,
          currency: order.currency,
          raw: JSON.stringify({ mode: "placeholder", confirmedAt: new Date().toISOString() }),
        },
      });
    }
  });

  return NextResponse.json({ ok: true, status: "PAID" });
}
