"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PRODUCT_TYPES = [
  { value: "PLUS", label: "Plus" },
  { value: "PRO_5X", label: "Pro 5x" },
  { value: "PRO_20X", label: "Pro 20x" },
];

export function CardCodeGenerator() {
  const router = useRouter();
  const [productType, setProductType] = useState(PRODUCT_TYPES[0].value);
  const [count, setCount] = useState("10");
  const [batchName, setBatchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codes, setCodes] = useState<string[]>([]);

  async function generate() {
    setError("");
    setCodes([]);

    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 500) {
      setError("数量必须是 1-500");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/card-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
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
    <div className="card space-y-3 p-4">
      <div className="grid gap-3 md:grid-cols-[180px_1fr_120px_140px]">
        <div>
          <select className="input" value={productType} onChange={(event) => setProductType(event.target.value)}>
            {PRODUCT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            className="input"
            value={batchName}
            onChange={(event) => setBatchName(event.target.value)}
            placeholder="批次"
          />
        </div>

        <div>
          <input className="input" value={count} onChange={(event) => setCount(event.target.value)} />
        </div>

        <div>
          <button disabled={loading} onClick={generate} className="btn-primary w-full py-2.5">
            {loading ? "生成中..." : "生成"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {codes.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>{codes.length} 个</span>
            <button onClick={copyCodes} className="text-sm font-semibold text-[var(--accent)]">
              复制
            </button>
          </div>
          <textarea readOnly className="input min-h-40 font-mono text-sm" value={codes.join("\n")} />
        </div>
      )}
    </div>
  );
}
