"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, parseCnyToCents } from "@/lib/money";

const POINT_PURCHASE_AMOUNTS = [5, 10, 50, 100, 500, 1000] as const;
const MIN_CUSTOM_AMOUNT_CENTS = 500;
const MAX_CUSTOM_AMOUNT_CENTS = 100_000_000;

type AmountSelection = (typeof POINT_PURCHASE_AMOUNTS)[number] | "custom";

type CreateResult =
  | { ok: false; message: string }
  | {
      ok: true;
      orderNo: string;
      cashierUrl: string | null;
      payableAmount: string;
      configured: boolean;
    };

function formatAmount(cents: number) {
  return formatMoney(cents).replace(/\.00$/, "");
}

function normalizeAmountInput(value: string) {
  const clean = value.replace(/[^\d.]/g, "");
  const [rawYuan = "", ...rest] = clean.split(".");
  const yuan = rawYuan.slice(0, 6);
  if (rest.length === 0) return yuan;
  const cent = rest.join("").slice(0, 2);
  return `${yuan || "0"}.${cent}`;
}

function AlipayIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="#1677FF"
    >
      <path d="M19.695 15.07c3.426 1.158 4.203 1.22 4.203 1.22V3.846c0-2.124-1.705-3.845-3.81-3.845H3.914C1.808.001.102 1.722.102 3.846v16.31c0 2.123 1.706 3.845 3.813 3.845h16.173c2.105 0 3.81-1.722 3.81-3.845v-.157s-6.19-2.602-9.315-4.119c-2.096 2.602-4.8 4.181-7.607 4.181-4.75 0-6.361-4.19-4.112-6.949.49-.602 1.324-1.175 2.617-1.497 2.025-.502 5.247.313 8.266 1.317a16.796 16.796 0 0 0 1.341-3.302H5.781v-.952h4.799V6.975H4.77v-.953h5.81V3.591s0-.409.411-.409h2.347v2.84h5.744v.951h-5.744v1.704h4.69a19.453 19.453 0 0 1-1.986 5.06c1.424.52 2.702 1.011 3.654 1.333m-13.81-2.032c-.596.06-1.71.325-2.321.869-1.83 1.608-.735 4.55 2.968 4.55 2.151 0 4.301-1.388 5.99-3.61-2.403-1.182-4.438-2.028-6.637-1.809" />
    </svg>
  );
}

function WechatIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="#07C160"
    >
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
    </svg>
  );
}

export function PointPurchaseForm() {
  const router = useRouter();
  const [amountSelection, setAmountSelection] = useState<AmountSelection>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"1" | "2">("2");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);
  const amountCents = amountSelection === "custom" ? parseCnyToCents(customAmount) : amountSelection * 100;
  const validAmount =
    amountCents !== null && amountCents >= MIN_CUSTOM_AMOUNT_CENTS && amountCents <= MAX_CUSTOM_AMOUNT_CENTS;
  const selectedAmountClass =
    "border-[var(--primary)] bg-indigo-50 text-[var(--primary)] ring-1 ring-[var(--primary)]/20";
  const idleAmountClass = "border-[var(--border)] bg-white text-slate-800 hover:bg-[var(--surface-2)]";

  async function createOrder() {
    if (loading) return;
    if (!validAmount || amountCents === null) {
      setResult({ ok: false, message: "最低充值金额为 ￥5" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/point-purchases/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountSelection === "custom" ? customAmount.trim() : String(amountSelection),
          paymentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "创建订单失败" });
        return;
      }
      setResult({
        ok: true,
        orderNo: data.orderNo,
        cashierUrl: data.cashierUrl ?? null,
        payableAmount: data.payableAmount,
        configured: Boolean(data.configured),
      });
      router.push(`/buy-points/${data.orderNo}`);
    } catch {
      setResult({ ok: false, message: "网络错误，请稍后重试" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-black tracking-tight">充值</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {POINT_PURCHASE_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setAmountSelection(amount)}
            className={
              "rounded-xl border px-4 py-4 text-left transition " +
              (amountSelection === amount ? selectedAmountClass : idleAmountClass)
            }
          >
            <div className="text-lg font-black">{formatAmount(amount * 100)}</div>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAmountSelection("custom")}
          className={
            "rounded-xl border px-4 py-4 text-left transition " +
            (amountSelection === "custom" ? selectedAmountClass : idleAmountClass)
          }
        >
          <div className="text-lg font-black">自定义</div>
        </button>
      </div>

      {amountSelection === "custom" ? (
        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">自定义金额</label>
          <div className="flex items-center rounded-xl border border-[var(--border)] bg-white px-4 py-3 focus-within:border-slate-950">
            <span className="mr-2 text-lg font-black text-[var(--foreground)]">￥</span>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-lg font-black outline-none"
              inputMode="decimal"
              value={customAmount}
              onChange={(event) => setCustomAmount(normalizeAmountInput(event.target.value))}
              placeholder="输入金额"
              disabled={loading}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPaymentType("2")}
          className={
            "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition " +
            (paymentType === "2"
              ? "border-sky-500 bg-sky-50 text-sky-700"
              : "border-[var(--border)] text-slate-700 hover:bg-[var(--surface-2)]")
          }
        >
          <AlipayIcon className="h-5 w-5 shrink-0" />
          支付宝
        </button>
        <button
          type="button"
          onClick={() => setPaymentType("1")}
          className={
            "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition " +
            (paymentType === "1"
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-[var(--border)] text-slate-700 hover:bg-[var(--surface-2)]")
          }
        >
          <WechatIcon className="h-5 w-5 shrink-0" />
          微信
        </button>
      </div>

      <button
        type="button"
        onClick={createOrder}
        disabled={loading}
        className="btn-primary mt-5 w-full py-3 text-base disabled:opacity-60"
      >
        {loading ? "创建中..." : validAmount && amountCents !== null ? `创建 ${formatAmount(amountCents)} 订单` : "创建订单"}
      </button>

      {result && !result.ok ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {result.message}
        </div>
      ) : null}

      {result?.ok && !result.configured ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700">
          订单已创建，支付二维码暂未开放。
        </div>
      ) : null}
    </div>
  );
}
