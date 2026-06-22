import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listUsableCoupons } from "@/lib/invite";

// 列出当前登录用户可用的优惠券; 传 subtotal(分) 时只返回达门槛的券。
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ coupons: [] });
  }
  const url = new URL(req.url);
  const raw = url.searchParams.get("subtotal");
  const subtotal = raw != null && /^\d+$/.test(raw) ? Number(raw) : undefined;

  const coupons = await listUsableCoupons(user.id, subtotal);
  return NextResponse.json({
    coupons: coupons.map((c) => ({
      id: c.id,
      kind: c.kind,
      amount: c.amount,
      minSpend: c.minSpend,
      expiresAt: c.expiresAt,
    })),
  });
}
