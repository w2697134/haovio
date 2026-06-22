import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const accountInfoSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
}, z.record(z.string(), z.string()));

const schema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().min(1).max(99),
        accountInfo: accountInfoSchema.optional(),
      })
    )
    .min(1, "购物车为空"),
  contactEmail: z.string().trim().max(100, "联系方式太长").optional(),
  note: z.string().max(500).optional(),
  couponId: z.string().optional(),
});

function validationErrorMessage(issues: z.core.$ZodIssue[]) {
  const first = issues[0];
  const path = first?.path.join(".");

  if (path?.includes("items")) return "订单信息不完整,请检查商品信息";
  if (path === "note") return "备注太长,请删减后再提交";
  if (path === "contactEmail") return "联系方式太长,请删减后再提交";
  return "提交信息有误,请检查后再试";
}

function genOrderNo() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const rand = Math.floor(Math.random() * 1e6).toString().padStart(6, "0");
  return `T${stamp}${rand}`;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: validationErrorMessage(parsed.error.issues) },
      { status: 400 }
    );
  }
  const { items, contactEmail, note, couponId } = parsed.data;

  const variantIds = items.map((i) => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  const vmap = new Map(variants.map((v) => [v.id, v]));

  for (const it of items) {
    if (!vmap.has(it.variantId)) {
      return NextResponse.json({ error: "商品规格已下架" }, { status: 400 });
    }
  }

  const currencies = new Set(items.map((i) => vmap.get(i.variantId)!.currency));
  if (currencies.size > 1) {
    return NextResponse.json(
      { error: "购物车含多种货币, 请分开结算" },
      { status: 400 }
    );
  }
  const currency = [...currencies][0] ?? "CNY";
  let total = 0;
  const accountInfo: Record<string, Record<string, string>> = {};
  const itemData = items.map((it) => {
    const v = vmap.get(it.variantId)!;
    total += v.price * it.quantity;
    if (it.accountInfo && Object.keys(it.accountInfo).length > 0) {
      accountInfo[v.product.slug] = it.accountInfo;
    }
    return {
      productName: v.product.name,
      variantName: v.name,
      unitPrice: v.price,
      quantity: it.quantity,
      variantId: v.id,
    };
  });

  // total 此时是订单原价(优惠前)
  const subtotal = total;

  // 校验并计算优惠券抵扣(仅登录用户、CNY 订单可用券)
  let discount = 0;
  let validCouponId: string | null = null;
  if (couponId) {
    if (!user) {
      return NextResponse.json({ error: "请先登录后再使用优惠券" }, { status: 401 });
    }
    if (currency !== "CNY") {
      return NextResponse.json({ error: "该订单货币不支持优惠券" }, { status: 400 });
    }
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon || coupon.userId !== user.id) {
      return NextResponse.json({ error: "优惠券不存在" }, { status: 400 });
    }
    if (coupon.status !== "UNUSED") {
      return NextResponse.json({ error: "优惠券已使用" }, { status: 400 });
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "优惠券已过期" }, { status: 400 });
    }
    if (subtotal < coupon.minSpend) {
      return NextResponse.json(
        { error: `未达使用门槛, 满 ${(coupon.minSpend / 100).toFixed(2)} 元可用` },
        { status: 400 }
      );
    }
    discount = Math.min(coupon.amount, subtotal); // 抵扣不超过订单原价
    validCouponId = coupon.id;
  }

  const finalTotal = subtotal - discount;

  // 原子下单: 创建订单 + 标记优惠券为已用(并发下用 status 条件保证只用一次)
  const order = await prisma.$transaction(async (tx) => {
    if (validCouponId) {
      const marked = await tx.coupon.updateMany({
        where: { id: validCouponId, status: "UNUSED" },
        data: { status: "USED", usedAt: new Date() },
      });
      if (marked.count === 0) {
        throw new Error("COUPON_RACE");
      }
    }
    const created = await tx.order.create({
      data: {
        orderNo: genOrderNo(),
        userId: user?.id ?? null,
        status: "PENDING",
        totalAmount: finalTotal,
        discountAmount: discount,
        couponId: validCouponId,
        currency,
        paymentMethod: null,
        contactEmail: contactEmail || null,
        note: note || null,
        accountInfo: JSON.stringify(accountInfo),
        items: { create: itemData },
      },
    });
    if (validCouponId) {
      await tx.coupon.update({ where: { id: validCouponId }, data: { orderId: created.id } });
    }
    return created;
  }).catch((e) => {
    if (e instanceof Error && e.message === "COUPON_RACE") return null;
    throw e;
  });

  if (!order) {
    return NextResponse.json({ error: "优惠券已使用, 请刷新后重试" }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderNo: order.orderNo,
    orderUrl: `/orders/${order.id}`,
  });
}
