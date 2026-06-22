import { prisma } from "@/lib/db";
import { CARD_CODE_STATUS_LABEL } from "@/lib/cardRedeem";
import { CardCodeGenerator } from "@/components/admin/CardCodeGenerator";

export const dynamic = "force-dynamic";

export default async function AdminCardCodesPage() {
  const codes = await prisma.cardCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { redeem: { select: { id: true, status: true, contactQq: true, contactWechat: true } } },
  });

  return (
    <div className="space-y-6">
      <CardCodeGenerator />

      <div className="card overflow-hidden">
        <div className="border-b border-[var(--border)] p-4">
          <h2 className="font-bold">最近卡密</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">只显示最近 100 个。生成后可复制本批次卡密发到闲鱼。</p>
        </div>
        {codes.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--muted)]">暂无卡密</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-xs text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">卡密</th>
                  <th className="px-4 py-3">商品</th>
                  <th className="px-4 py-3">批次</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">提交联系</th>
                  <th className="px-4 py-3">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {codes.map((card) => (
                  <tr key={card.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{card.code}</td>
                    <td className="px-4 py-3">{card.productType}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{card.batchName ?? "-"}</td>
                    <td className="px-4 py-3">{CARD_CODE_STATUS_LABEL[card.status as keyof typeof CARD_CODE_STATUS_LABEL] ?? card.status}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {card.redeem
                        ? [card.redeem.contactQq ? "QQ " + card.redeem.contactQq : "", card.redeem.contactWechat ? "微信 " + card.redeem.contactWechat : ""]
                            .filter(Boolean)
                            .join(" / ") || "-"
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted)]">{card.createdAt.toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
