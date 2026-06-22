import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildAlipayWapPayUrl,
  centsToAlipayAmount,
  getAlipayConfig,
} from "@/lib/alipay";

const schema = z.object({
  orderId: z.string().min(1),
});

const PAYABLE_STATUSES = new Set(["PENDING", "PENDING_PAYMENT"]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  let config;
  try {
    config = getAlipayConfig();
  } catch {
    return NextResponse.json({ error: "支付宝还没有配置完成" }, { status: 503 });
  }

  const user = await getCurrentUser();
  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }
  if (order.userId && (!user || (order.userId !== user.id && user.role !== "ADMIN"))) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  if (!PAYABLE_STATUSES.has(order.status)) {
    return NextResponse.json({ error: "订单当前状态不能支付" }, { status: 400 });
  }
  if (order.currency !== "CNY") {
    return NextResponse.json({ error: "支付宝暂时只支持人民币订单" }, { status: 400 });
  }
  if (order.totalAmount <= 0) {
    return NextResponse.json({ error: "订单金额错误" }, { status: 400 });
  }

  const subject = order.items[0]
    ? `${order.items[0].productName}${order.items.length > 1 ? " 等" : ""}`
    : `订单 ${order.orderNo}`;

  const payUrl = buildAlipayWapPayUrl(config, {
    outTradeNo: order.orderNo,
    subject: subject.slice(0, 128),
    totalAmount: centsToAlipayAmount(order.totalAmount),
    quitUrl: config.returnUrl,
  });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PENDING_PAYMENT",
        paymentMethod: "ALIPAY",
      },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "ALIPAY",
        status: "CREATED",
        externalId: order.orderNo,
        amount: order.totalAmount,
        currency: order.currency,
        raw: JSON.stringify({
          outTradeNo: order.orderNo,
          createdAt: new Date().toISOString(),
        }),
      },
    });
  });

  return NextResponse.json({ ok: true, payUrl });
}
