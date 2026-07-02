import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  assertAllowedPointPurchaseAmount,
  centsToYuan,
  generatePointPurchaseNo,
  pointPurchaseExpiresAt,
  signVmqCreateOrder,
  yuanToCents,
} from "@/lib/pointPurchase";

const schema = z.object({
  amount: z.union([z.string(), z.number()]).optional(),
  points: z.number().optional(),
  paymentType: z.enum(["1", "2"]).default("2"),
});

const POINT_PURCHASE_QR_ENABLED = process.env.POINT_PURCHASE_QR_ENABLED === "1";

function getOrigin(req: Request) {
  return process.env.APP_BASE_URL || new URL(req.url).origin;
}

function buildVmqQrUrl(vmqBaseUrl: string, payUrl: string) {
  const endpoint = (process.env.VMQ_QR_ENDPOINT || `${vmqBaseUrl}/api/qrcode/generate`).replace(/\/+$/, "");
  return `${endpoint}?url=${encodeURIComponent(payUrl)}`;
}

async function callVmqCreateOrder({
  req,
  orderNo,
  amountCents,
  paymentType,
}: {
  req: Request;
  orderNo: string;
  amountCents: number;
  paymentType: string;
}) {
  const vmqBaseUrl = process.env.VMQ_BASE_URL?.replace(/\/+$/, "");
  const vmqKey = process.env.VMQ_KEY;
  if (!vmqBaseUrl || !vmqKey) return null;

  const price = centsToYuan(amountCents);
  const param = "cny";
  const origin = getOrigin(req);
  const params = new URLSearchParams({
    payId: orderNo,
    param,
    type: paymentType,
    price,
    sign: signVmqCreateOrder({ payId: orderNo, param, type: paymentType, price, key: vmqKey }),
    notifyUrl: `${origin}/api/payments/vmq/notify`,
    returnUrl: `${origin}/buy-points/${orderNo}`,
  });

  const res = await fetch(`${vmqBaseUrl}/createOrder?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.code !== 1 || !data.data) {
    throw new Error(data?.msg || "VMQ_CREATE_FAILED");
  }

  const reallyCents = yuanToCents(data.data.reallyPrice);
  if (reallyCents === null) throw new Error("VMQ_PRICE_INVALID");
  const payUrl = String(data.data.payUrl || "");
  if (!payUrl) throw new Error("VMQ_PAY_URL_MISSING");

  return {
    providerOrderId: String(data.data.orderId || ""),
    payableCents: reallyCents,
    cashierUrl: buildVmqQrUrl(vmqBaseUrl, payUrl),
    providerPayload: JSON.stringify(data),
  };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const amountCents = yuanToCents(parsed.data.amount ?? parsed.data.points ?? "");
  if (amountCents === null) {
    return NextResponse.json({ error: "金额格式错误" }, { status: 400 });
  }

  try {
    assertAllowedPointPurchaseAmount(amountCents);
  } catch {
    return NextResponse.json({ error: "最低充值金额为 ￥5" }, { status: 400 });
  }

  const orderNo = generatePointPurchaseNo();
  let vmqOrder:
    | {
        providerOrderId: string;
        payableCents: number;
        cashierUrl: string;
        providerPayload: string;
      }
    | null = null;

  if (POINT_PURCHASE_QR_ENABLED) {
    try {
      vmqOrder = await callVmqCreateOrder({
        req,
        orderNo,
        amountCents,
        paymentType: parsed.data.paymentType,
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "创建支付订单失败" },
        { status: 502 }
      );
    }
  }

  const order = await prisma.pointPurchaseOrder.create({
    data: {
      orderNo,
      userId: user.id,
      points: amountCents,
      amountCents,
      payableCents: vmqOrder?.payableCents ?? amountCents,
      paymentType: parsed.data.paymentType,
      providerOrderId: vmqOrder?.providerOrderId,
      providerPayload: vmqOrder?.providerPayload ?? "{}",
      cashierUrl: vmqOrder?.cashierUrl,
      expiresAt: pointPurchaseExpiresAt(),
    },
  });

  return NextResponse.json({
    orderNo: order.orderNo,
    points: order.points,
    amount: centsToYuan(order.amountCents),
    payableAmount: centsToYuan(order.payableCents),
    cashierUrl: order.cashierUrl,
    configured: Boolean(vmqOrder),
  });
}
