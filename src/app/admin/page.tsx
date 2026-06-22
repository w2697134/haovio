import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [userCount, productCount, orderCount, pendingFulfill, pendingRedeems, pendingCancelRedeems, paidAgg, recent] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
      prisma.cardRedeem.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
      prisma.cardRedeem.count({ where: { status: "RECHARGED_PENDING_CANCEL" } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ["PAID", "PROCESSING", "COMPLETED"] } },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { items: true },
      }),
    ]);

  const stats = [
    { label: "总营收(已付)", value: formatMoney(paidAgg._sum.totalAmount ?? 0), accent: true },
    { label: "订单总数", value: orderCount },
    { label: "待处理(已付款/充值中)", value: pendingFulfill, warn: pendingFulfill > 0 },
    { label: "待兑换卡密", value: pendingRedeems, warn: pendingRedeems > 0 },
    { label: "待取消续订", value: pendingCancelRedeems, warn: pendingCancelRedeems > 0 },
    { label: "商品 / 用户", value: `${productCount} / ${userCount}` },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-sm text-[var(--muted)]">{s.label}</div>
            <div
              className={`mt-2 text-2xl font-extrabold ${
                s.accent ? "text-[var(--accent)]" : s.warn ? "text-[var(--warning)]" : ""
              }`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">最近订单</h2>
          <Link href="/admin/orders" className="text-sm text-[var(--accent)]">查看全部 →</Link>
        </div>
        <div className="card divide-y divide-[var(--border)]">
          {recent.map((o) => (
            <Link key={o.id} href={`/admin/orders`} className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[var(--muted)]">{o.orderNo}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  {o.items.map((i) => i.productName).join(", ")}
                </div>
              </div>
              <span className="font-semibold text-[var(--accent)]">
                {formatMoney(o.totalAmount, o.currency)}
              </span>
            </Link>
          ))}
          {recent.length === 0 && <p className="p-6 text-center text-[var(--muted)]">暂无订单</p>}
        </div>
      </div>
    </div>
  );
}
