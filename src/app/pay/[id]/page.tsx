import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";
import { PlaceholderPayActions } from "@/components/PlaceholderPayActions";
import { AlipayPayActions } from "@/components/AlipayPayActions";
import { isAlipayConfigured } from "@/lib/alipay";

export const dynamic = "force-dynamic";

const QR_CELLS = Array.from({ length: 121 }, (_, i) => {
  const row = Math.floor(i / 11);
  const col = i % 11;
  const inCorner =
    (row < 3 && col < 3) ||
    (row < 3 && col > 7) ||
    (row > 7 && col < 3);
  return inCorner || (row * 7 + col * 5 + row * col) % 6 < 2;
});

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!order) notFound();
  if (order.userId && (!user || (order.userId !== user.id && user.role !== "ADMIN"))) notFound();

  const isPendingPayment = order.status === "PENDING_PAYMENT" || order.status === "PENDING";
  const alipayConfigured = isAlipayConfigured();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/orders/${order.id}`} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        查看订单详情
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">订单支付</h1>
              <p className="mt-1 font-mono text-sm text-[var(--muted)]">{order.orderNo}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-5 divide-y divide-[var(--border)]">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-[var(--muted)]">
                    {item.variantName} × {item.quantity}
                  </div>
                </div>
                <div className="font-semibold">
                  {formatMoney(item.unitPrice * item.quantity, order.currency)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
            <span className="text-[var(--muted)]">应付金额</span>
            <span className="text-3xl font-extrabold text-[var(--accent)]">
              {formatMoney(order.totalAmount, order.currency)}
            </span>
          </div>

          {!isPendingPayment && (
            <div className="mt-5 rounded-lg bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)]">
              当前订单已不是待支付状态。你可以返回订单详情查看最新进度。
            </div>
          )}
        </section>

        <aside className="card p-5">
          <div className="text-center">
            <div className="font-semibold">支付占位码</div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              当前不接第三方支付，先保留订单支付入口和占位展示
            </p>
          </div>

          <div className="mx-auto mt-5 grid h-56 w-56 grid-cols-11 gap-1 rounded-xl bg-white p-4 shadow-sm">
            {QR_CELLS.map((filled, i) => (
              <span
                key={i}
                className={filled ? "rounded-sm bg-[#111827]" : "rounded-sm bg-white"}
              />
            ))}
          </div>

          {isPendingPayment && (
            <p className="mt-3 rounded-lg bg-[var(--surface-2)] p-3 text-center text-xs text-[var(--muted)]">
              这里以后可以换成别的支付方式，当前只是保留流程占位。
            </p>
          )}

          <div className="mt-4 rounded-lg bg-[var(--surface-2)] p-3 text-center text-sm">
            <div className="text-[var(--muted)]">订单号</div>
            <div className="mt-1 font-mono font-semibold">{order.orderNo}</div>
          </div>

          {isPendingPayment ? (
            <div className="mt-4">
              {alipayConfigured ? (
                <AlipayPayActions orderId={order.id} />
              ) : (
                <PlaceholderPayActions orderId={order.id} />
              )}
              <p className="mt-2 text-center text-xs text-[var(--muted)]">
                现在是本地占位确认，正式收款方式确定后再接真实回执。
              </p>
            </div>
          ) : (
            <Link href={`/orders/${order.id}`} className="btn-primary mt-4 block py-3 text-center">
              返回订单
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
