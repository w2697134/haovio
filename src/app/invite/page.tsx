import { redirect } from "next/navigation";
import { InviteShareCard } from "@/components/InviteClient";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureInviteCode, INVITE_CONFIG, REFERRAL_LEDGER_TYPE } from "@/lib/invite";
import { formatCnyBalance } from "@/lib/money";

export const dynamic = "force-dynamic";

function publicBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_BASE_URL || process.env.APP_BASE_URL || "";
  const base = raw.replace(/\/$/, "");
  if (!base || /localhost|127\.0\.0\.1|47\./.test(base)) return "https://haovio.com";
  return base;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBalance(amount: number) {
  return formatCnyBalance(amount);
}

export default async function InvitePage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const inviteCode = await ensureInviteCode(sessionUser.id);

  const [user, inviteeCount, rewardStats, rewardRecords] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { pointsBalance: true },
    }),
    prisma.user.count({ where: { invitedById: sessionUser.id } }),
    prisma.pointLedger.aggregate({
      where: { userId: sessionUser.id, type: REFERRAL_LEDGER_TYPE },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.pointLedger.findMany({
      where: { userId: sessionUser.id, type: REFERRAL_LEDGER_TYPE },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!user) redirect("/login");

  const shareLink = `${publicBaseUrl()}/login?ref=${inviteCode}`;
  const totalReward = rewardStats._sum.amount ?? 0;
  const rewardRate = INVITE_CONFIG.referralRewardRateBps / 100;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">邀请返利</h1>

      <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <InviteShareCard inviteCode={inviteCode} shareLink={shareLink} />

        <div className="grid gap-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-sm text-[var(--muted)]">累计返利</div>
            <div className="mt-2 text-4xl font-medium tabular-nums text-[var(--foreground)]">
              {formatBalance(totalReward)}
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">余额</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
              <div className="text-xl font-medium tabular-nums text-[var(--foreground)]">{inviteeCount}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">已邀请</div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
              <div className="text-xl font-medium tabular-nums text-[var(--foreground)]">
                {formatBalance(user.pointsBalance)}
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">当前余额</div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
              <div className="text-xl font-medium tabular-nums text-[var(--foreground)]">{rewardRate}%</div>
              <div className="mt-1 text-xs text-[var(--muted)]">返利比例</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-medium tracking-tight text-[var(--foreground)]">返利记录</h2>
          {rewardRecords.length > 0 ? (
            <span className="text-sm text-[var(--muted)] tabular-nums">{rewardStats._count._all} 笔</span>
          ) : null}
        </div>

        {rewardRecords.length === 0 ? (
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
                <circle cx="9" cy="8" r="3.2" />
                <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
                <path d="M18 8v5M20.5 10.5h-5" />
              </svg>
            </span>
            <p className="text-sm text-[var(--foreground)]">还没有返利记录</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="divide-y divide-[var(--border)]">
              {rewardRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--foreground)]">邀请返利</div>
                    <div className="mt-1 truncate text-xs text-[var(--muted)]">
                      {formatDate(record.createdAt)}
                      {record.note ? ` · ${record.note}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-base font-medium tabular-nums text-emerald-600">
                    +{formatBalance(record.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
