import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  alipayAmountToCents,
  getAlipayConfig,
  verifyAlipayParams,
} from "@/lib/alipay";

const SUCCESS_STATUSES = new Set(["TRADE_SUCCESS", "TRADE_FINISHED"]);

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return textResponse("fail");

  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") params[key] = value;
  }

  let config;
  try {
    config = getAlipayConfig();
  } catch {
    return textResponse("fail");
  }

  if (!verifyAlipayParams(params, config.alipayPublicKey)) {
    return textResponse("fail");
  }

  const tradeStatus = params.trade_status;
  if (!SUCCESS_STATUSES.has(tradeStatus)) {
    return textResponse("success");
  }

  const orderNo = params.out_trade_no;
  const tradeNo = params.trade_no;
  const paidCents = alipayAmountToCents(params.total_amount ?? "");
  if (!orderNo || !tradeNo || paidCents === null) {
    return textResponse("fail");
  }

  const order = await prisma.order.findUnique({ where: { orderNo } });
  if (!order) {
    return textResponse("fail");
  }
  if (order.currency !== "CNY" || order.totalAmount !== paidCents) {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "ALIPAY",
        status: "FAILED",
        externalId: tradeNo,
        amount: paidCents,
        currency: "CNY",
        raw: JSON.stringify({ reason: "AMOUNT_MISMATCH", params }),
      },
    });
    return textResponse("fail");
  }

  await prisma.$transaction(async (tx) => {
    if (order.status !== "PAID") {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: order.paidAt ?? new Date(),
          paymentMethod: "ALIPAY",
        },
      });
    }

    const existingSucceeded = await tx.payment.findFirst({
      where: {
        orderId: order.id,
        provider: "ALIPAY",
        status: "SUCCEEDED",
        externalId: tradeNo,
      },
    });

    if (existingSucceeded) {
      await tx.payment.update({
        where: { id: existingSucceeded.id },
        data: { raw: JSON.stringify(params) },
      });
      return;
    }

    const createdPayment = await tx.payment.findFirst({
      where: {
        orderId: order.id,
        provider: "ALIPAY",
        status: "CREATED",
      },
      orderBy: { createdAt: "desc" },
    });

    if (createdPayment) {
      await tx.payment.update({
        where: { id: createdPayment.id },
        data: {
          status: "SUCCEEDED",
          externalId: tradeNo,
          raw: JSON.stringify(params),
        },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "ALIPAY",
          status: "SUCCEEDED",
          externalId: tradeNo,
          amount: order.totalAmount,
          currency: order.currency,
          raw: JSON.stringify(params),
        },
      });
    }
  });

  return textResponse("success");
}

function textResponse(text: "success" | "fail") {
  return new NextResponse(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
