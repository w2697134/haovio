"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminQuestion = {
  id: string;
  question: string;
  resolved: boolean;
  createdAt: string;
};

export function QuestionRow({ q }: { q: AdminQuestion }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await fetch(`/api/admin/questions/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !q.resolved }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-3 border-b border-[var(--border)] p-4">
      <div className="flex-1">
        <div className={`text-sm ${q.resolved ? "text-[var(--muted)] line-through" : ""}`}>
          {q.question}
        </div>
        <div className="mt-1 text-xs text-[var(--muted)]">
          {new Date(q.createdAt).toLocaleString("zh-CN")}
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${
          q.resolved
            ? "bg-[var(--muted)]/15 text-[var(--muted)]"
            : "bg-[var(--success)]/15 text-[var(--success)]"
        }`}
      >
        {q.resolved ? "已处理" : "标记已处理"}
      </button>
      <button onClick={remove} disabled={busy} className="shrink-0 text-xs text-[var(--danger)]">
        删除
      </button>
    </div>
  );
}
