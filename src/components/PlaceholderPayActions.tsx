"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PlaceholderPayActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirmPaid() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/placeholder/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "支付确认失败");
        return;
      }
      router.push(`/orders/${orderId}`);
      router.refresh();
    } catch {
      setError("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={confirmPaid} disabled={loading} className="btn-primary w-full py-3">
        {loading ? "确认中..." : "占位: 模拟支付成功"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
