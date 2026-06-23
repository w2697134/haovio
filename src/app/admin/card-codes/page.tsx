import { prisma } from "@/lib/db";
import { CARD_CODE_STATUS_LABEL } from "@/lib/cardRedeem";
import { CardCodeGenerator } from "@/components/admin/CardCodeGenerator";

export const dynamic = "force-dynamic";

const PRODUCT_LABEL: Record<string, string> = {
  PLUS: "Plus",
  PRO_5X: "Pro 5x",
  PRO_20X: "Pro 20x",
};

export default async function AdminCardCodesPage() {
  const codes = await prisma.cardCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { redeem: { select: { id: true, status: true, contactQq: true, contactWechat: true } } },
  });

  return (
    <div className="space-y-5">
      <CardCodeGenerator />

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border)] p-4">
          <h2 className="text-lg font-bold">最近卡密</h2>
        </div>

        {codes.length === 0 ? (
          <p className="p-10 text-center text-[var(--muted)]">暂无卡密</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">卡密</th>
                  <th className="px-4 py-3">套餐</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">批次</th>
                  <th className="px-4 py-3">联系方式</th>
                  <th className="px-4 py-3">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {codes.map((card) => (
                  <tr key={card.id}>
                    <td className="px-4 py-3 font-mono text-xs font-bold">{card.code}</td>
                    <td className="px-4 py-3">{PRODUCT_LABEL[card.productType] ?? card.productType}</td>
                    <td className="px-4 py-3">
                      {CARD_CODE_STATUS_LABEL[card.status as keyof typeof CARD_CODE_STATUS_LABEL] ?? card.status}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{card.batchName ?? "-"}</td>
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
