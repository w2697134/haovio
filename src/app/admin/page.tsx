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

  const redeems = await prisma.cardRedeem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          card: { select: { code: true, productType: true, batchName: true, status: true } },
        },
      });

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

  return (
    <div>
      <form action="/admin" className="mb-6 flex justify-end gap-3">
          {showDone && <input type="hidden" name="done" value="1" />}
          <input
            name="q"
            defaultValue={query}
            className="input h-12 w-72 bg-white text-sm shadow-sm"
            placeholder="卡密 / QQ / 微信"
          />
          <button className="btn-primary px-6 text-sm">搜</button>
          <a
            href={showDone ? "/admin" : "/admin?done=1"}
            className="rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-bold shadow-sm hover:bg-[var(--surface-2)]"
          >
            {showDone ? "待处理" : "已完成"}
          </a>
      </form>

      <section className="card p-7">
        <h2 className="mb-5 text-2xl font-extrabold">{showDone ? "已完成" : "待处理"}</h2>
        {data.length === 0 ? (
          <p className="p-10 text-center text-[var(--muted)]">暂无</p>
        ) : (
          <div className="space-y-4">
            {data.map((redeem) => <CardRedeemRow key={redeem.id} redeem={redeem} />)}
          </div>
        )}
      </section>
    </div>
  );
}
