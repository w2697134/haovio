import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { centsToYuan } from "@/lib/pointPurchase";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { orderNo } = await params;
  const order = await prisma.pointPurchaseOrder.findUnique({
    where: { orderNo },
    select: {
      orderNo: true,
      userId: true,
      status: true,
      points: true,
      amountCents: true,
      payableCents: true,
      cashierUrl: true,
      paidAt: true,
      expiresAt: true,
    },
  });

  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json({
    orderNo: order.orderNo,
    status: order.status,
    points: order.points,
    amount: centsToYuan(order.amountCents),
    payableAmount: centsToYuan(order.payableCents),
    cashierUrl: order.cashierUrl,
    paidAt: order.paidAt?.toISOString() ?? null,
    expiresAt: order.expiresAt.toISOString(),
  });
}
