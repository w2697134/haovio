import { prisma } from "@/lib/db";
import { QuestionRow, type AdminQuestion } from "@/components/admin/QuestionRow";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  const rows = await prisma.unknownQuestion.findMany({
    orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  const pending = rows.filter((r) => !r.resolved).length;

  const data: AdminQuestion[] = rows.map((r) => ({
    id: r.id,
    question: r.question,
    resolved: r.resolved,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <h2 className="font-bold">客户问懵的问题</h2>
        {pending > 0 && (
          <span className="rounded-md bg-[var(--warning)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--warning)]">
            {pending} 条待看
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-[var(--muted)]">
        客服答不上来、自动引导加 QQ 的问题都记在这。看看大家常问啥,值得的就补进知识库(改 src/lib/kb.ts 或告诉我)。
      </p>

      <div className="card overflow-hidden">
        {data.length === 0 ? (
          <p className="p-10 text-center text-[var(--muted)]">还没有记录 — 客服目前都答得上来 👍</p>
        ) : (
          data.map((q) => <QuestionRow key={q.id} q={q} />)
        )}
      </div>
    </div>
  );
}
