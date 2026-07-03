"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { emitClientEvent } from "@/lib/clientEvents";
import { formatCnyBalance } from "@/lib/money";

const tools = [
  { href: "/admin", label: "总订单" },
  { href: "/admin/pending", label: "待处理" },
  { href: "/admin/products", label: "商品" },
  { href: "/admin/questions", label: "问题" },
  { href: "/admin/settings", label: "设置" },
];

export function AdminManagePanel() {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/users/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, amount, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "操作失败");
        return;
      }
      setMessage(`${data.user.email} · ${formatCnyBalance(data.user.pointsBalance)}`);
      setTarget("");
      setAmount("");
      setNote("");
      emitClientEvent("balanceChanged");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">管理</h1>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-black text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {tool.label}
            </Link>
          ))}
        </div>
      </section>

      <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">发余额</h2>
        <div className="mt-5 space-y-3">
          <input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="input h-11"
            placeholder="用户ID / 邮箱"
          />
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="input h-11"
            placeholder="金额"
            inputMode="decimal"
          />
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="input h-11"
            placeholder="备注"
          />
        </div>
        {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
        {message ? <p className="mt-3 text-sm font-semibold text-emerald-600">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 h-11 w-full rounded-xl bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "处理中" : "确认"}
        </button>
      </form>
    </div>
  );
}
