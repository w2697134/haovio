"use client";

import { useState } from "react";

type ResultState =
  | { ok: false; message: string }
  | { ok: true; message: string; productType?: string; cookieCount?: number };

export function CardRedeemForm({
  product,
  variant,
  expectedProductType,
}: {
  product?: string;
  variant?: string;
  expectedProductType?: string;
}) {
  const [code, setCode] = useState("");
  const [contactType, setContactType] = useState<"QQ" | "WECHAT">("QQ");
  const [contactValue, setContactValue] = useState("");
  const [cookieJson, setCookieJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  async function submit() {
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/card-redeems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          contactQq: contactType === "QQ" ? contactValue.trim() || undefined : undefined,
          contactWechat: contactType === "WECHAT" ? contactValue.trim() || undefined : undefined,
          expectedProductType,
          cookieJson,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "提交失败，请检查后重试" });
        return;
      }
      setResult({
        ok: true,
        message: "提交成功，后台会按队列处理。请保持 QQ/微信可联系。",
        productType: data.productType,
        cookieCount: data.cookieMeta?.count,
      });
      setCode("");
      setContactValue("");
      setCookieJson("");
    } catch {
      setResult({ ok: false, message: "网络错误，请稍后重试" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-5 p-5">
      {(product || variant) && (
        <div className="rounded-lg bg-[var(--surface-2)] p-3 text-sm">
          <div className="text-xs text-[var(--muted)]">当前兑换</div>
          <div className="mt-1 font-semibold">
            {[product, variant].filter(Boolean).join(" · ")}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">卡密</label>
        <input
          className="input font-mono"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">联系方式</label>
        <div className="flex">
          <select
            className="input !w-36 rounded-r-none border-r-0"
            value={contactType}
            onChange={(e) => setContactType(e.target.value as "QQ" | "WECHAT")}
          >
            <option value="QQ">QQ</option>
            <option value="WECHAT">微信</option>
          </select>
          <input
            className="input flex-1 rounded-l-none"
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">ChatGPT Cookie JSON</label>
        <textarea
          className="input min-h-64 font-mono text-xs"
          value={cookieJson}
          onChange={(e) => setCookieJson(e.target.value)}
        />
      </div>

      {result && (
        <div
          className={
            "rounded-lg border p-3 text-sm " +
            (result.ok
              ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
              : "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]")
          }
        >
          <div>{result.message}</div>
          {result.ok && (
            <div className="mt-1 text-xs opacity-90">
              {result.productType ? "商品：" + result.productType + " · " : ""}
              {typeof result.cookieCount === "number" ? "Cookie 条数：" + result.cookieCount : ""}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={submit}
        className="btn-primary w-full py-3"
      >
        {loading ? "提交中..." : "提交兑换"}
      </button>
    </div>
  );
}
