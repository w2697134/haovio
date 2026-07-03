"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { emitClientEvent } from "@/lib/clientEvents";
import { formatMoney } from "@/lib/money";
import {
  SMS_ACTIVATION_COUNTRIES,
  SMS_ACTIVATION_OPERATORS,
  SMS_ACTIVATION_SERVICES,
} from "@/lib/smsActivationOptions";

type SmsActivationOrder = {
  id: string;
  status: string;
  phone: string | null;
  smsCode: string | null;
  smsText: string | null;
  expiresAt: string | null;
  pointsCost: number;
  serviceCode: string;
  countryCode: string;
  operatorCode: string;
};

type ResultState =
  | { ok: false; message: string }
  | { ok: true; message: string };

export function SmsActivationRedeemForm({
  variantId,
  productName,
  variantName,
  pointsCost,
  balance,
}: {
  variantId: string;
  productName: string;
  variantName: string;
  pointsCost: number;
  balance: number;
}) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [order, setOrder] = useState<SmsActivationOrder | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [copied, setCopied] = useState("");

  const insufficient = balance < pointsCost;
  const shortfallCents = Math.max(pointsCost - balance, 0);
  const balanceLabel = formatMoney(balance).replace(/\.00$/, "");
  const costLabel = formatMoney(pointsCost).replace(/\.00$/, "");
  const afterBalanceLabel = formatMoney(Math.max(balance - pointsCost, 0)).replace(/\.00$/, "");
  const shortfallLabel = formatMoney(shortfallCents).replace(/\.00$/, "");
  const activeOrder = order && ["ACTIVE", "RECEIVED"].includes(order.status);
  const serviceCode = SMS_ACTIVATION_SERVICES[0].code;
  const countryCode = SMS_ACTIVATION_COUNTRIES[0].code;
  const operatorCode = SMS_ACTIVATION_OPERATORS[0].code;

  useEffect(() => {
    if (!order || order.status !== "ACTIVE") return;
    const timer = window.setInterval(async () => {
      const res = await fetch(`/api/sms-activations/${order.id}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.order) setOrder(data.order);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [order]);

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1200);
  }

  async function createOrder() {
    if (loading || insufficient) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/sms-activations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, serviceCode, countryCode, operatorCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "自动买号失败" });
        return;
      }
      setOrder(data.order);
      emitClientEvent("balanceChanged");
      setResult({ ok: true, message: "已自动买号，等待验证码。" });
    } catch {
      setResult({ ok: false, message: "网络错误，请稍后重试" });
    } finally {
      setLoading(false);
    }
  }

  async function patchOrder(action: "cancel" | "finish") {
    if (!order || actionLoading) return;
    setActionLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/sms-activations/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "操作失败" });
        return;
      }
      setOrder(data.order);
      emitClientEvent("balanceChanged");
      setResult({ ok: true, message: action === "cancel" ? "订单已取消，余额已退回。" : "订单已完成。" });
    } catch {
      setResult({ ok: false, message: "网络错误，请稍后重试" });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="card space-y-5 p-5">
      <div className="rounded-xl border border-[var(--border)] bg-white p-4">
        <div className="text-lg font-bold text-[var(--foreground)]">{productName} / {variantName}</div>
      </div>

      <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm sm:grid-cols-3">
        <div>
          <div className="text-[var(--muted)]">当前余额</div>
          <div className="mt-1 font-black tabular-nums text-[var(--foreground)]">{balanceLabel}</div>
        </div>
        <div>
          <div className="text-[var(--muted)]">本次消耗</div>
          <div className="mt-1 font-black tabular-nums text-rose-600">-{costLabel}</div>
        </div>
        <div>
          <div className="text-[var(--muted)]">购买后余额</div>
          <div className="mt-1 font-black tabular-nums text-[var(--foreground)]">{afterBalanceLabel}</div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--primary)] bg-indigo-50 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold text-[var(--foreground)]">越南 OpenAI 接码</div>
            <div className="mt-1 text-[var(--muted)]">系统自动买号，收到短信后自动显示验证码。</div>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--primary)]">全自动</span>
        </div>
        <div className="mt-3 border-t border-indigo-100 pt-3 text-xs leading-5 text-[var(--muted)]">
          适合 OpenAI / ChatGPT 验证。提交后请在有效期内使用号码，验证码会在本页自动刷新。
        </div>
      </div>

      {order ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[var(--muted)]">订单状态</div>
              <div className="mt-1 text-lg font-black text-[var(--foreground)]">
                {order.status === "ACTIVE" ? "等待验证码" : order.status === "RECEIVED" ? "已收到验证码" : order.status}
              </div>
            </div>
            {order.expiresAt ? (
              <div className="text-right text-xs font-semibold text-[var(--muted)]">
                到期 {new Date(order.expiresAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            ) : null}
          </div>

          {order.phone ? (
            <div className="mt-4 rounded-lg bg-[var(--surface-2)] p-3">
              <div className="text-xs font-semibold text-[var(--muted)]">手机号</div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="font-mono text-xl font-black text-[var(--foreground)]">{order.phone}</div>
                <button
                  type="button"
                  onClick={() => copy(order.phone!, "phone")}
                  className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-bold text-slate-700"
                >
                  {copied === "phone" ? "已复制" : "复制"}
                </button>
              </div>
            </div>
          ) : null}

          {order.smsCode ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="text-xs font-semibold text-emerald-700">验证码</div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="font-mono text-2xl font-black text-emerald-800">{order.smsCode}</div>
                <button
                  type="button"
                  onClick={() => copy(order.smsCode!, "code")}
                  className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-700"
                >
                  {copied === "code" ? "已复制" : "复制"}
                </button>
              </div>
              {order.smsText ? <div className="mt-2 text-xs text-emerald-700">{order.smsText}</div> : null}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700">
              系统每 5 秒自动刷新一次短信。
            </div>
          )}

          {activeOrder ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => patchOrder("cancel")}
                disabled={actionLoading || order.status === "RECEIVED"}
                className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                取消并退款
              </button>
              <button
                type="button"
                onClick={() => patchOrder("finish")}
                disabled={actionLoading || !order.smsCode}
                className="btn-primary py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                完成订单
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div
          className={
            "rounded-lg border p-3 text-sm font-semibold " +
            (result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700")
          }
        >
          {result.message}
        </div>
      ) : null}

      {!order ? (
        insufficient ? (
          <Link href="/buy-points" className="btn-primary block w-full py-3 text-center">
            余额不足，先充值 {shortfallLabel}
          </Link>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={createOrder}
            className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "自动获取中..." : `获取越南号码，消耗 ${costLabel}`}
          </button>
        )
      ) : null}
    </div>
  );
}
