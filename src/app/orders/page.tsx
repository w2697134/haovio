import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">我的订单</h1>

      {orders.length === 0 ? (
        <div className="card p-12 text-center text-[var(--muted)]">
          <p>还没有订单</p>
          <Link href="/" className="btn-primary mt-4 inline-block px-5 py-2">去充值</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="card block p-4 transition hover:border-[var(--primary)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-[var(--muted)]">{o.orderNo}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="mt-1 text-sm">
                    {o.items.map((i) => `${i.productName}(${i.variantName})×${i.quantity}`).join(", ")}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {new Date(o.createdAt).toLocaleString("zh-CN")}
                  </div>
                </div>
                <div className="text-lg font-bold text-[var(--accent)]">
                  {formatMoney(o.totalAmount, o.currency)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
