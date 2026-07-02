"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StatusPayload = {
  status: string;
  paidAt: string | null;
  expiresAt: string;
  payableAmount: string;
};

function statusMessage(status: string) {
  if (status === "PENDING") return "等待付款";
  if (status === "PAID") return "支付成功，已到账";
  if (status === "EXPIRED") return "订单已过期";
  if (status === "CANCELLED") return "订单已取消";
  return status;
}

export function PointPurchaseStatus({
  orderNo,
  initialStatus,
}: {
  orderNo: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState(statusMessage(initialStatus));

  useEffect(() => {
    if (status !== "PENDING") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const res = await fetch(`/api/point-purchases/${encodeURIComponent(orderNo)}`, { cache: "no-store" });
        const data = (await res.json()) as Partial<StatusPayload> & { error?: string };
        if (!res.ok) throw new Error(data.error || "查询失败");

        if (!cancelled && data.status) {
          setStatus(data.status);
          setMessage(statusMessage(data.status));
          if (data.status === "PAID") {
            router.refresh();
            return;
          }
        }
      } catch {
        if (!cancelled) setMessage("正在等待到账确认");
      }

      if (!cancelled) timer = setTimeout(poll, 2000);
    }

    timer = setTimeout(poll, 1200);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderNo, router, status]);

  return (
    <div
      className={
        "rounded-xl border p-4 text-sm font-semibold " +
        (status === "PAID"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700")
      }
    >
      {message}
    </div>
  );
}
