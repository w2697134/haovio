import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseCookieMeta } from "@/lib/cardRedeem";
import { CardRedeemRow, type AdminCardRedeem } from "@/components/admin/CardRedeemRow";

export const dynamic = "force-dynamic";

export default async function AdminCardRedeemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const query = q?.trim() ?? "";
  const where: Prisma.CardRedeemWhereInput = {};

  if (status === "pending") {
    where.status = { in: ["PENDING", "PROCESSING", "RECHARGED_PENDING_CANCEL"] };
  } else if (status === "completed") {
    where.status = "COMPLETED";
  } else if (status === "problem") {
    where.status = { in: ["INFO_INVALID", "VOID"] };
  }

  if (query) {
    where.OR = [
      { card: { code: { contains: query } } },
      { contactQq: { contains: query } },
      { contactWechat: { contains: query } },
    ];
  }

  function hrefFor(nextStatus?: string) {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? "/admin/card-redeems?" + qs : "/admin/card-redeems";
  }

  const redeems = await prisma.cardRedeem.findMany({
    where,
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
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={hrefFor()} className={"rounded-lg border px-3 py-1.5 text-sm " + (!status ? "border-[var(--primary)] text-[var(--foreground)]" : "border-[var(--border)] text-[var(--muted)]")}>
            全部
          </Link>
          <Link href={hrefFor("pending")} className={"rounded-lg border px-3 py-1.5 text-sm " + (status === "pending" ? "border-[var(--primary)] text-[var(--foreground)]" : "border-[var(--border)] text-[var(--muted)]")}>
            未完成
          </Link>
          <Link href={hrefFor("completed")} className={"rounded-lg border px-3 py-1.5 text-sm " + (status === "completed" ? "border-[var(--primary)] text-[var(--foreground)]" : "border-[var(--border)] text-[var(--muted)]")}>
            已完成
          </Link>
          <Link href={hrefFor("problem")} className={"rounded-lg border px-3 py-1.5 text-sm " + (status === "problem" ? "border-[var(--primary)] text-[var(--foreground)]" : "border-[var(--border)] text-[var(--muted)]")}>
            异常/作废
          </Link>
        </div>

        <form action="/admin/card-redeems" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={query}
            className="input h-9 w-56 text-sm"
            placeholder="搜卡密 / QQ / 微信"
          />
          <button className="btn-primary px-4 text-sm">搜索</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {data.length === 0 ? (
          <p className="p-10 text-center text-[var(--muted)]">暂无兑换提交</p>
        ) : (
          data.map((redeem) => <CardRedeemRow key={redeem.id} redeem={redeem} />)
        )}
      </div>
    </div>
  );
}
