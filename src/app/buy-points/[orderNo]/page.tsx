/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { PointPurchaseStatus } from "@/components/PointPurchaseStatus";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { centsToYuan, getPaymentTypeLabel } from "@/lib/pointPurchase";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  if (status === "PENDING") return "待支付";
  if (status === "PAID") return "已到账";
  if (status === "EXPIRED") return "已过期";
  if (status === "CANCELLED") return "已取消";
  return status;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PointPurchasePayPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const [user, { orderNo }] = await Promise.all([getCurrentUser(), params]);
  if (!user) redirect("/login");

  const order = await prisma.pointPurchaseOrder.findUnique({
    where: { orderNo },
    select: {
      orderNo: true,
      userId: true,
      status: true,
      payableCents: true,
      paymentType: true,
      cashierUrl: true,
      paidAt: true,
      expiresAt: true,
    },
  });

  if (!order || order.userId !== user.id) redirect("/account");

  const isPending = order.status === "PENDING";
  const statusClass =
    order.status === "PAID"
      ? "bg-emerald-50 text-emerald-700"
      : isPending
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <div className="relative px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-4 w-full max-w-6xl -translate-x-1/2 px-4">
        <div className="pointer-events-auto">
          <BackButton />
        </div>
      </div>

      <section className="mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">充值</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--foreground)]">支付订单</h1>
          </div>
          <span className={`rounded px-2 py-1 text-xs font-bold ${statusClass}`}>{statusLabel(order.status)}</span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="grid aspect-square place-items-center rounded-lg bg-white">
              {order.cashierUrl && isPending ? (
                <img src={order.cashierUrl} alt="支付二维码" className="h-full w-full object-contain p-3" />
              ) : (
                <div className="px-4 text-center text-sm font-medium text-[var(--muted)]">
                  {order.status === "PAID" ? "支付成功" : "支付二维码暂未开放"}
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              {isPending ? (order.cashierUrl ? "扫码完成后会自动刷新状态" : "请联系客服完成处理") : "订单状态已更新"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-[var(--muted)]">应付金额</div>
              <div className="mt-1 text-4xl font-black tracking-tight text-[var(--foreground)]">
                ￥{centsToYuan(order.payableCents)}
              </div>
            </div>

            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
                <dt className="text-[var(--muted)]">支付方式</dt>
                <dd className="font-medium text-[var(--foreground)]">{getPaymentTypeLabel(order.paymentType)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
                <dt className="text-[var(--muted)]">订单号</dt>
                <dd className="font-mono text-xs font-medium text-[var(--foreground)]">{order.orderNo}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
                <dt className="text-[var(--muted)]">有效期</dt>
                <dd className="font-medium text-[var(--foreground)]">{formatDate(order.expiresAt)}</dd>
              </div>
              {order.paidAt ? (
                <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
                  <dt className="text-[var(--muted)]">到账时间</dt>
                  <dd className="font-medium text-[var(--foreground)]">{formatDate(order.paidAt)}</dd>
                </div>
              ) : null}
            </dl>

            <PointPurchaseStatus orderNo={order.orderNo} initialStatus={order.status} />

            <div className="flex flex-wrap gap-2.5">
              <Link href="/buy-points" className="btn-primary px-4 py-2.5">
                重新选择金额
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-2)]"
              >
                返回账户
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
