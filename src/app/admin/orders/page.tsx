import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { OrderRow, type AdminOrder } from "@/components/admin/OrderRow";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const query = q?.trim() ?? "";
  const where: Prisma.OrderWhereInput = {};

  if (status === "unfinished") {
    where.status = { in: ["PENDING", "PAID", "PROCESSING"] };
  } else if (status === "completed") {
    where.status = "COMPLETED";
  }

  if (query) {
    where.orderNo = { contains: query };
  }

  function hrefFor(nextStatus?: string) {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { email: true, name: true } } },
  });

  const data: AdminOrder[] = orders.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    status: o.status,
    totalAmount: o.totalAmount,
    currency: o.currency,
    contactEmail: o.contactEmail,
    note: o.note,
    createdAt: o.createdAt.toISOString(),
    accountInfo: o.accountInfo,
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      variantName: i.variantName,
      quantity: i.quantity,
    })),
    userEmail: o.user?.email ?? "游客订单",
    userName: o.user?.name ?? null,
  }));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={hrefFor()}
            className={`rounded-lg border px-3 py-1.5 text-sm ${!status ? "border-[var(--primary)] text-[var(--foreground)]" : "border-[var(--border)] text-[var(--muted)]"}`}
          >
            全部
          </Link>
          <Link
            href={hrefFor("unfinished")}
            className={`rounded-lg border px-3 py-1.5 text-sm ${status === "unfinished" ? "border-[var(--primary)] text-[var(--foreground)]" : "border-[var(--border)] text-[var(--muted)]"}`}
          >
            未完成
          </Link>
          <Link
            href={hrefFor("completed")}
            className={`rounded-lg border px-3 py-1.5 text-sm ${status === "completed" ? "border-[var(--primary)] text-[var(--foreground)]" : "border-[var(--border)] text-[var(--muted)]"}`}
          >
            已完成
          </Link>
        </div>

        <form action="/admin/orders" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={query}
            className="input h-9 w-56 text-sm"
            placeholder="搜索订单号"
          />
          <button className="btn-primary px-4 text-sm">搜索</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {data.length === 0 ? (
          <p className="p-10 text-center text-[var(--muted)]">暂无订单</p>
        ) : (
          data.map((o) => <OrderRow key={o.id} order={o} />)
        )}
      </div>
    </div>
  );
}
