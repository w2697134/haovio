import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CARD_CODE_STATUS_LABEL } from "@/lib/cardRedeem";
import { CardCodeGenerator } from "@/components/admin/CardCodeGenerator";

export const dynamic = "force-dynamic";

const PRODUCT_LABEL: Record<string, string> = {
  PLUS: "Plus",
  PRO_5X: "Pro 5x",
  PRO_20X: "Pro 20x",
};

const FILTERS = [
  { key: "", label: "全部" },
  { key: "unused", label: "未使用" },
  { key: "submitted", label: "已提交" },
  { key: "recharged", label: "已充值" },
  { key: "completed", label: "已完成" },
  { key: "problem", label: "异常" },
];

const STATUS_RANK: Record<string, number> = {
  UNUSED: 0,
  SUBMITTED: 1,
  RECHARGED: 2,
  INFO_INVALID: 3,
  COMPLETED: 4,
  VOID: 5,
};

function whereForFilter(filter: string): Prisma.CardCodeWhereInput {
  if (filter === "unused") return { status: "UNUSED" };
  if (filter === "submitted") return { status: "SUBMITTED" };
  if (filter === "recharged") return { status: "RECHARGED" };
  if (filter === "completed") return { status: "COMPLETED" };
  if (filter === "problem") return { status: { in: ["INFO_INVALID", "VOID"] } };
  return {};
}

function hrefFor(filter: string) {
  return filter ? "/admin/card-codes?status=" + filter : "/admin/card-codes";
}

export default async function AdminCardCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "" } = await searchParams;
  const where = whereForFilter(status);

  const codes = await prisma.cardCode.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { redeem: { select: { id: true, status: true, contactQq: true, contactWechat: true } } },
  });

  const sortedCodes = [...codes].sort((a, b) => {
    const rankDiff = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
    if (rankDiff !== 0) return rankDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const activeLabel = FILTERS.find((item) => item.key === status)?.label ?? "全部";

  return (
    <div className="space-y-5">
      <CardCodeGenerator />

      <section className="card overflow-hidden">
        <div className="flex justify-end border-b border-[var(--border)] p-3">
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-xl border border-[var(--border)] bg-white px-5 py-2 text-sm font-bold shadow-sm hover:bg-[var(--surface-2)]">
              查找 · {activeLabel}
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-36 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg">
              {FILTERS.map((item) => (
                <Link
                  key={item.key || "all"}
                  href={hrefFor(item.key)}
                  className={
                    "block px-4 py-2 text-sm hover:bg-[var(--surface-2)] " +
                    (item.key === status ? "font-bold text-[var(--primary)]" : "")
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </div>

        {sortedCodes.length === 0 ? (
          <p className="p-10 text-center text-[var(--muted)]">暂无</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">卡密</th>
                  <th className="px-4 py-3">套餐</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">联系方式</th>
                  <th className="px-4 py-3">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedCodes.map((card) => (
                  <tr key={card.id}>
                    <td className="px-4 py-3 font-mono text-xs font-bold">{card.code}</td>
                    <td className="px-4 py-3">{PRODUCT_LABEL[card.productType] ?? card.productType}</td>
                    <td className="px-4 py-3">
                      {CARD_CODE_STATUS_LABEL[card.status as keyof typeof CARD_CODE_STATUS_LABEL] ?? card.status}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {card.redeem
                        ? [
                            card.redeem.contactQq ? "QQ " + card.redeem.contactQq : "",
                            card.redeem.contactWechat ? "微信 " + card.redeem.contactWechat : "",
                          ]
                            .filter(Boolean)
                            .join(" / ") || "-"
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted)]">
                      {card.createdAt.toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
