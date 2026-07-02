import { prisma } from "@/lib/db";
import { grantReferralPointReward } from "@/lib/invite";
import { centsToYuan, signVmqCallback, yuanToCents } from "@/lib/pointPurchase";

function getParam(url: URL, key: string) {
  return url.searchParams.get(key) ?? "";
}

async function handleNotify(req: Request) {
  const url = new URL(req.url);
  const payId = getParam(url, "payId");
  const param = getParam(url, "param");
  const type = getParam(url, "type");
  const price = getParam(url, "price");
  const reallyPrice = getParam(url, "reallyPrice");
  const sign = getParam(url, "sign");
  const key = process.env.VMQ_KEY;

  if (!key) return new Response("vmq_key_missing", { status: 500 });
  if (!payId || !type || !price || !reallyPrice || !sign) {
    return new Response("bad_request", { status: 400 });
  }

  const expectedSign = signVmqCallback({ payId, param, type, price, reallyPrice, key });
  if (expectedSign !== sign) {
    return new Response("error_sign", { status: 400 });
  }

  const priceCents = yuanToCents(price);
  const reallyCents = yuanToCents(reallyPrice);
  if (priceCents === null || reallyCents === null) {
    return new Response("bad_price", { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.pointPurchaseOrder.findUnique({
      where: { orderNo: payId },
      include: { user: { select: { pointsBalance: true, invitedById: true } } },
    });
    if (!order) return "not_found";
    if (order.status === "PAID") return "success";
    if (order.status !== "PENDING") return "bad_status";
    if (order.amountCents !== priceCents || order.payableCents !== reallyCents) return "amount_mismatch";

    const updatedUser = await tx.user.update({
      where: { id: order.userId },
      data: { pointsBalance: { increment: order.points } },
      select: { pointsBalance: true },
    });

    await tx.pointPurchaseOrder.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentType: type,
        providerPayload: JSON.stringify({
          payId,
          param,
          type,
          price,
          reallyPrice,
          sign,
        }),
      },
    });

    await tx.pointLedger.create({
      data: {
        userId: order.userId,
        type: "POINT_PURCHASE",
        amount: order.points,
        balanceAfter: updatedUser.pointsBalance,
        refType: "PointPurchaseOrder",
        refId: order.id,
        note: `充值 ￥${centsToYuan(order.payableCents)}`,
      },
    });

    if (order.user.invitedById) {
      await grantReferralPointReward({
        inviterId: order.user.invitedById,
        inviteeId: order.userId,
        amountCents: order.payableCents,
        refType: "PointPurchaseOrder",
        refId: order.id,
        tx,
      });
    }

    return "success";
  });

  return new Response(result === "success" ? "success" : result, {
    status: result === "success" ? 200 : 400,
  });
}

export async function GET(req: Request) {
  return handleNotify(req);
}

export async function POST(req: Request) {
  return handleNotify(req);
}
