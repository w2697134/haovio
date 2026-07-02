import Link from "next/link";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCnyBalance } from "@/lib/money";
import { centsToYuan } from "@/lib/pointPurchase";
import { POINT_REDEEM_STATUS_LABEL } from "@/lib/points";

export const dynamic = "force-dynamic";

const REDEEM_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-sky-50 text-sky-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  INFO_INVALID: "bg-rose-50 text-rose-700",
  VOID: "bg-slate-100 text-slate-600",
};

const PURCHASE_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-600",
};

type Activity = {
  id: string;
  date: Date;
  title: string;
  meta: string;
  tag: string;
  tagClass: string;
  href?: string;
  pointsText?: string;
  pointsClass?: string;
};

function formatBalance(amount: number) {
  return formatCnyBalance(amount);
}

function ledgerTypeLabel(type: string) {
  if (type === "CODE_REDEEM") return "充值";
  if (type === "POINT_PURCHASE") return "充值";
  if (type === "PRODUCT_REDEEM") return "商品购买";
  if (type === "REFERRAL_REWARD") return "邀请返利";
  if (type === "ADMIN_ADJUST") return "后台调整";
  if (type === "REFUND") return "退款";
  return type;
}

function purchaseStatusLabel(status: string) {
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

export default async function AccountPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const [user, purchases, redeems, ledgers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        email: true,
        name: true,
        pointsBalance: true,
      },
    }),
    prisma.pointPurchaseOrder.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.pointRedeem.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.pointLedger.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!user) redirect("/login");

  const displayName = user.name || user.email;
  const avatarText = displayName.slice(0, 1).toUpperCase();

  const activities: Activity[] = [
    ...purchases.map((order) => ({
      id: `purchase-${order.id}`,
      date: order.createdAt,
      title: `￥${centsToYuan(order.payableCents)}`,
      meta: `充值 · 订单 ${order.orderNo}`,
      tag: purchaseStatusLabel(order.status),
      tagClass: PURCHASE_STATUS_STYLE[order.status] ?? "bg-slate-100 text-slate-600",
      href: `/buy-points/${order.orderNo}`,
    })),
    ...redeems.map((redeem) => ({
      id: `redeem-${redeem.id}`,
      date: redeem.createdAt,
      title: redeem.variantName,
      meta: `${formatBalance(redeem.pointsCost)} · ${redeem.deliveryMode === "COOKIE" ? "Cookie 自助" : "人工处理"}`,
      tag: POINT_REDEEM_STATUS_LABEL[redeem.status as keyof typeof POINT_REDEEM_STATUS_LABEL] ?? redeem.status,
      tagClass: REDEEM_STATUS_STYLE[redeem.status] ?? "bg-slate-100 text-slate-600",
    })),
    ...ledgers.map((ledger) => ({
      id: `ledger-${ledger.id}`,
      date: ledger.createdAt,
      title: ledgerTypeLabel(ledger.type),
      meta: ledger.note
        ? `${ledger.note} · 余额 ${formatBalance(ledger.balanceAfter)}`
        : `余额 ${formatBalance(ledger.balanceAfter)}`,
      tag: "余额明细",
      tagClass: "bg-slate-100 text-slate-600",
      pointsText: `${ledger.amount >= 0 ? "+" : "-"}${formatBalance(Math.abs(ledger.amount))}`,
      pointsClass: ledger.amount >= 0 ? "text-emerald-600" : "text-rose-600",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="relative px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-4 w-full max-w-6xl -translate-x-1/2 px-4">
        <div className="pointer-events-auto">
          <BackButton />
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
      <section className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-lg font-medium text-[var(--muted)]">
            {avatarText}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-medium tracking-tight text-[var(--foreground)]">{displayName}</h1>
            <div className="mt-0.5 truncate text-sm text-[var(--muted)]">{user.email}</div>
          </div>
        </div>
        <LogoutButton />
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm text-[var(--muted)]">当前余额</div>
            <div className="mt-2 text-5xl font-medium leading-none tracking-tight tabular-nums text-[var(--foreground)]">
              {formatBalance(user.pointsBalance)}
            </div>
            <div className="mt-3 text-sm text-[var(--muted)]">可用于购买商品</div>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/buy-points"
              className="inline-flex items-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-2)]"
            >
              充值
            </Link>
            <Link
              href="/redeem"
              className="inline-flex items-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-2)]"
            >
              去购买
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-medium tracking-tight text-[var(--foreground)]">账户记录</h2>
          {activities.length > 0 ? (
            <span className="text-sm text-[var(--muted)] tabular-nums">{activities.length} 条</span>
          ) : null}
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
                <path d="M9 8h6M9 12h6" />
              </svg>
            </span>
            <p className="text-sm text-[var(--foreground)]">还没有余额记录</p>
            <p className="text-xs text-[var(--muted)]">充值或购买后，明细会显示在这里</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="divide-y divide-[var(--border)]">
              {activities.map((activity) => {
                const content = (
                  <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">{activity.title}</span>
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${activity.tagClass}`}>
                          {activity.tag}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-xs text-[var(--muted)]">
                        {formatDate(activity.date)} · {activity.meta}
                      </div>
                    </div>
                    {activity.pointsText ? (
                      <div className={`shrink-0 text-base font-medium tabular-nums ${activity.pointsClass}`}>
                        {activity.pointsText}
                      </div>
                    ) : null}
                  </div>
                );

                return activity.href ? (
                  <Link key={activity.id} href={activity.href} className="block transition hover:bg-[var(--surface-2)]">
                    {content}
                  </Link>
                ) : (
                  <div key={activity.id}>{content}</div>
                );
              })}
            </div>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
