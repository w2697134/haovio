"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CardCodeGenerator() {
  const router = useRouter();
  const [productType, setProductType] = useState("ChatGPT Plus");
  const [batchName, setBatchName] = useState("");
  const [count, setCount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codes, setCodes] = useState<string[]>([]);

  async function generate() {
    setError("");
    setCodes([]);
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 500) {
      setError("生成数量必须是 1-500 的整数");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/card-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: productType.trim(),
          batchName: batchName.trim() || undefined,
          count: n,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "生成失败");
        return;
      }
      setCodes(Array.isArray(data.codes) ? data.codes : []);
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function copyCodes() {
    if (codes.length === 0) return;
    await navigator.clipboard.writeText(codes.join("\n"));
  }

  return (
    <div className="card space-y-4 p-5">
      <h2 className="font-bold">批量生成卡密</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">商品类型</label>
          <input className="input" value={productType} onChange={(e) => setProductType(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">批次备注</label>
          <input className="input" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="闲鱼批次" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">数量</label>
          <input className="input" value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button disabled={loading} onClick={generate} className="btn-primary w-full py-2.5">
            {loading ? "生成中..." : "生成"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {codes.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-[var(--muted)]">本次生成 {codes.length} 个</span>
            <button onClick={copyCodes} className="text-sm text-[var(--accent)]">复制全部</button>
          </div>
          <textarea readOnly className="input min-h-40 font-mono text-xs" value={codes.join("\n")} />
        </div>
      )}
    </div>
  );
}
