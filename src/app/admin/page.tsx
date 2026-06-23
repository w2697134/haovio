import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseCookieMeta } from "@/lib/cardRedeem";
import { CardRedeemRow, type AdminCardRedeem } from "@/components/admin/CardRedeemRow";

export const dynamic = "force-dynamic";

const activeStatuses = ["PENDING", "PROCESSING", "RECHARGED_PENDING_CANCEL", "INFO_INVALID"];

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; done?: string }>;
}) {
  const { q, done } = await searchParams;
  const query = q?.trim() ?? "";
  const showDone = done === "1";

  const where: Prisma.CardRedeemWhereInput = showDone
    ? { status: "COMPLETED" }
    : { status: { in: activeStatuses } };

  if (query) {
    where.OR = [
      { card: { code: { contains: query } } },
      { contactQq: { contains: query } },
      { contactWechat: { contains: query } },
    ];
  }

  const [pendingCount, rechargedCount, invalidCount, completedCount, redeems] =
    await Promise.all([
      prisma.cardRedeem.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
      prisma.cardRedeem.count({ where: { status: "RECHARGED_PENDING_CANCEL" } }),
      prisma.cardRedeem.count({ where: { status: "INFO_INVALID" } }),
      prisma.cardRedeem.count({ where: { status: "COMPLETED" } }),
      prisma.cardRedeem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          card: { select: { code: true, productType: true, batchName: true, status: true } },
        },
      }),
    ]);

  const data: AdminCardRedeem[] = redeems.map((r) => ({
    id: r.id,
    status: r.status,
    contactQq: r.contactQq,
    contactWechat: r.contactWechat,
    cookieMeta: parseCookieMeta(r.cookieMeta),
    cookieClearedAt: r.cookieClearedAt?.toISOString() ?? null,
    clearAfterAt: r.clearAfterAt?.toISOString() ?? null,
    renewalStatus: r.renewalStatus,
    adminNote: r.adminNote,
    createdAt: r.createdAt.toISOString(),
    processedAt: r.processedAt?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
    card: r.card,
  }));

  const stats = [
    { label: "待处理", value: pendingCount },
    { label: "已充值", value: rechargedCount },
    { label: "资料错误", value: invalidCount },
    { label: "已完成", value: completedCount },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="text-sm text-[var(--muted)]">{stat.label}</div>
            <div className="mt-1 text-3xl font-extrabold">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border)] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">{showDone ? "已完成" : "待处理"}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                只处理客户提交的卡密、联系方式和 Cookie。
              </p>
            </div>

            <form action="/admin" className="flex flex-wrap gap-2">
              {showDone && <input type="hidden" name="done" value="1" />}
              <input
                name="q"
                defaultValue={query}
                className="input h-10 w-56 text-sm"
                placeholder="搜卡密 / QQ / 微信"
              />
              <button className="btn-primary px-4 text-sm">搜索</button>
              <a
                href={showDone ? "/admin" : "/admin?done=1"}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-2)]"
              >
                {showDone ? "看待处理" : "看已完成"}
              </a>
            </form>
          </div>
        </div>

        {data.length === 0 ? (
          <p className="p-10 text-center text-[var(--muted)]">
            {showDone ? "暂无已完成记录" : "暂无待处理记录"}
          </p>
        ) : (
          data.map((redeem) => <CardRedeemRow key={redeem.id} redeem={redeem} />)
        )}
      </section>
    </div>
  );
}
