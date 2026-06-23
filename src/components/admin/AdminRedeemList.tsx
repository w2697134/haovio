import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseCookieMeta } from "@/lib/cardRedeem";
import { CardRedeemRow, type AdminCardRedeem } from "@/components/admin/CardRedeemRow";

export async function AdminRedeemList({
  title,
  action,
  where,
  searchParams,
}: {
  title: string;
  action: string;
  where: Prisma.CardRedeemWhereInput;
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const finalWhere: Prisma.CardRedeemWhereInput = { ...where };

  if (query) {
    finalWhere.OR = [
      { card: { code: { contains: query } } },
      { contactQq: { contains: query } },
      { contactWechat: { contains: query } },
    ];
  }

  const redeems = await prisma.cardRedeem.findMany({
    where: finalWhere,
    orderBy: { createdAt: "desc" },
    take: 100,
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
      <form action={action} className="mb-6 flex justify-end gap-3">
        <input
          name="q"
          defaultValue={query}
          className="input h-12 !w-80 bg-white text-sm shadow-sm"
          placeholder="卡密 / QQ / 微信"
        />
        <button className="btn-primary h-12 px-7 text-sm">搜</button>
      </form>

      <section className="card p-7">
        <h2 className="mb-5 text-2xl font-extrabold">{title}</h2>
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
