"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { formatCnyBalance } from "@/lib/money";
import { POINT_REDEEM_STATUS_LABEL } from "@/lib/points";

export type AdminPointRedeem = {
  id: string;
  status: string;
  productName: string;
  variantName: string;
  pointsCost: number;
  contactQq: string | null;
  contactWechat: string | null;
  deliveryMode: string;
  createdAt: string;
  user: { email: string; name: string | null };
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-sky-50 text-sky-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  INFO_INVALID: "bg-rose-50 text-rose-700",
  VOID: "bg-slate-100 text-slate-600",
};

export function PointRedeemRow({ redeem }: { redeem: AdminPointRedeem }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionText, setSessionText] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function patch(payload: Record<string, unknown>) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/point-redeems/" + redeem.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function revealSession() {
    if (sessionLoading) return;
    setError("");
    setSessionLoading(true);
    try {
      const res = await fetch("/api/admin/point-redeems/" + redeem.id);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "读取 Session 失败");
        return;
      }
      setSessionText(data.sessionJson ?? "");
    } catch {
      setError("读取 Session 失败");
    } finally {
      setSessionLoading(false);
    }
  }

  async function copySession() {
    if (!sessionText) return;
    try {
      await navigator.clipboard.writeText(sessionText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = sessionText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const contact = [
    redeem.contactQq ? "QQ " + redeem.contactQq : "",
    redeem.contactWechat ? "微信 " + redeem.contactWechat : "",
  ]
    .filter(Boolean)
    .join(" / ");
  const statusText = POINT_REDEEM_STATUS_LABEL[redeem.status as keyof typeof POINT_REDEEM_STATUS_LABEL] ?? redeem.status;
  const isSessionDelivery = redeem.deliveryMode === "COOKIE";
  const deliveryText = isSessionDelivery ? "Session提交" : "人工交付";
  const createdAt = new Date(redeem.createdAt).toLocaleString("zh-CN");

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.9fr)_auto] xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[redeem.status] ?? "bg-slate-100 text-slate-600"}`}>
              {statusText}
            </span>
            <span className="truncate text-base font-semibold text-slate-950">
              {redeem.productName} / {redeem.variantName}
            </span>
          </div>
          <div className="mt-1 truncate font-mono text-xs text-slate-400">{redeem.id}</div>
        </div>

        <div className="min-w-0 text-sm text-slate-500">
          <div className="truncate">{redeem.user.email}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>{contact || "未留联系方式"}</span>
            <span>{deliveryText}</span>
            <span>{createdAt}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <div className="min-w-20 text-right text-base font-semibold tabular-nums text-slate-950">
            {formatCnyBalance(redeem.pointsCost)}
          </div>
          <div className="flex flex-wrap gap-2">
            {isSessionDelivery ? (
              <button
                disabled={sessionLoading}
                onClick={sessionText ? copySession : revealSession}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
              >
                {sessionText ? (
                  copied ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-4 w-4" />
                      复制 Session
                    </>
                  )
                ) : sessionLoading ? (
                  "读取中"
                ) : (
                  "查看 Session"
                )}
              </button>
            ) : null}
            <button
              disabled={loading}
              onClick={() => patch({ status: "PROCESSING" })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              处理
            </button>
            <button
              disabled={loading}
              onClick={() => patch({ status: "INFO_INVALID" })}
              className="rounded-lg border border-rose-100 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
            >
              有误
            </button>
            <button
              disabled={loading}
              onClick={() => patch({ status: "COMPLETED" })}
              className="rounded-lg border border-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
            >
              完成
            </button>
          </div>
        </div>
      </div>

      {sessionText ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-500">直充 Session</div>
          <textarea
            readOnly
            value={sessionText}
            className="h-28 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-700 outline-none"
          />
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
