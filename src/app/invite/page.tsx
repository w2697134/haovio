import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureInviteCode, INVITE_CONFIG } from "@/lib/invite";
import { formatMoney } from "@/lib/money";
import { InviteShareCard } from "@/components/InviteClient";

export const dynamic = "force-dynamic";

const COUPON_KIND_LABEL: Record<string, string> = {
  WELCOME: "迎新券",
  REFERRAL: "邀请奖励券",
};

const COUPON_STATUS_LABEL: Record<string, string> = {
  UNUSED: "可使用",
  USED: "已使用",
  EXPIRED: "已过期",
};

function couponState(c: { status: string; expiresAt: Date | null }) {
  if (c.status === "UNUSED" && c.expiresAt && c.expiresAt.getTime() <= Date.now()) {
    return "EXPIRED";
  }
  return c.status;
}

export default async function InvitePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const inviteCode = await ensureInviteCode(user.id);

  const [inviteeCount, coupons] = await Promise.all([
    prisma.user.count({ where: { invitedById: user.id } }),
    prisma.coupon.findMany({
      where: { userId: user.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const usableCount = coupons.filter((c) => couponState(c) === "UNUSED").length;

  const base = process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "";
  const shareLink = `${base}/register?ref=${inviteCode}`;

  const welcomeYuan = formatMoney(INVITE_CONFIG.welcomeCouponCents);
  const rewardYuan = formatMoney(INVITE_CONFIG.referralRewardCents);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">邀请有礼</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        把邀请码或链接分享给好友。好友注册即得 {welcomeYuan} 迎新券；好友首单完成后，你再得 {rewardYuan} 奖励券。
      </p>

      <div className="mt-6">
        <InviteShareCard inviteCode={inviteCode} shareLink={shareLink} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="card p-5 text-center">
          <div className="text-3xl font-extrabold text-[var(--accent)]">{inviteeCount}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">已邀请好友</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-extrabold text-[var(--accent)]">{usableCount}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">可用优惠券</div>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold">我的优惠券</h2>
      {coupons.length === 0 ? (
        <p className="card p-6 text-center text-sm text-[var(--muted)]">
          还没有优惠券。邀请好友或使用邀请码注册即可获得。
        </p>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => {
            const state = couponState(c);
            const usable = state === "UNUSED";
            return (
              <div
                key={c.id}
                className={`card flex items-center justify-between p-4 ${usable ? "" : "opacity-60"}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-[var(--accent)]">
                      {formatMoney(c.amount)}
                    </span>
                    <span className="rounded bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--muted)]">
                      {COUPON_KIND_LABEL[c.kind] ?? c.kind}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {c.minSpend > 0 ? `满 ${formatMoney(c.minSpend)} 可用` : "无门槛"}
                    {c.expiresAt
                      ? ` · ${new Date(c.expiresAt).toLocaleDateString("zh-CN")} 到期`
                      : " · 永久有效"}
                  </div>
                </div>
                <span className="text-sm text-[var(--muted)]">
                  {COUPON_STATUS_LABEL[state] ?? state}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
