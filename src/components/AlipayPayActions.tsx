"use client";

import { useState } from "react";

export function AlipayPayActions({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startPay() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/alipay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.payUrl) {
        setError(data.error ?? "支付宝支付创建失败");
        return;
      }
      window.location.href = data.payUrl;
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={startPay} disabled={loading} className="btn-primary w-full py-3">
        {loading ? "正在跳转..." : "支付宝支付"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
