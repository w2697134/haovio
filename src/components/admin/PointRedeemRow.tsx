"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CloseIcon, CopyIcon, TrashIcon } from "@/components/icons";
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
  const [cookieJsonText, setCookieJsonText] = useState("");
  const [cookieHeaderText, setCookieHeaderText] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState("");
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
      setCookieJsonText(data.cookieJson ?? "");
      setCookieHeaderText(data.cookieHeader ?? "");
    } catch {
      setError("读取 Session 失败");
    } finally {
      setSessionLoading(false);
    }
  }

  async function deleteRedeem() {
    const ok = window.confirm(`确认删除兑换订单 ${redeem.id}？删除后无法恢复。`);
    if (!ok) return;

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/point-redeems/" + redeem.id, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "删除失败");
        return;
      }
      router.refresh();
    } catch {
      setError("删除失败");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, key: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1500);
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
  const shortId = redeem.id.length > 14 ? `${redeem.id.slice(0, 14)}...` : redeem.id;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusPill className={STATUS_CLASS[redeem.status]}>{statusText}</StatusPill>
            <span className="truncate text-base font-semibold text-slate-950">{redeem.productName} / {redeem.variantName}</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{deliveryText}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span className="font-mono">{shortId}</span>
            <span>{createdAt}</span>
          </div>
        </div>

        <div className="min-w-20 text-left text-base font-semibold tabular-nums text-slate-950 xl:text-right">
          {formatCnyBalance(redeem.pointsCost)}
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="rounded-lg border border-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
            >
              详情
            </button>
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
            <button
              type="button"
              disabled={loading}
              onClick={deleteRedeem}
              className="grid h-10 w-10 place-items-center rounded-lg border border-rose-100 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
              aria-label="删除兑换订单"
              title="删除"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}

      {detailsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill className={STATUS_CLASS[redeem.status]}>{statusText}</StatusPill>
                  <span className="text-lg font-black text-slate-950">{redeem.productName} / {redeem.variantName}</span>
                </div>
                <div className="mt-1 text-sm text-slate-500">{formatCnyBalance(redeem.pointsCost)} · {createdAt}</div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="关闭"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoBlock label="订单号" value={redeem.id} copyKey="order" copied={copied} onCopy={copy} mono />
              <InfoBlock label="用户邮箱" value={redeem.user.email} copyKey="email" copied={copied} onCopy={copy} />
              <InfoBlock label="联系方式" value={contact || "未留联系方式"} copyKey="contact" copied={copied} onCopy={contact ? copy : undefined} />
              <InfoBlock label="交付方式" value={deliveryText} />
            </div>

            {isSessionDelivery ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">直充 Session</div>
                    <div className="mt-1 text-xs text-slate-500">可转换为 Cookie JSON 或 Cookie Header。</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SessionCopyButton
                      disabled={sessionLoading}
                      loading={sessionLoading}
                      hasValue={Boolean(sessionText)}
                      copied={copied === "session"}
                      label="复制 Session"
                      onClick={sessionText ? () => copy(sessionText, "session") : revealSession}
                    />
                    {cookieJsonText ? (
                      <SessionCopyButton
                        disabled={sessionLoading}
                        hasValue
                        copied={copied === "cookie-json"}
                        label="复制 Cookie JSON"
                        onClick={() => copy(cookieJsonText, "cookie-json")}
                      />
                    ) : null}
                    {cookieHeaderText ? (
                      <SessionCopyButton
                        disabled={sessionLoading}
                        hasValue
                        copied={copied === "cookie-header"}
                        label="复制 Cookie Header"
                        onClick={() => copy(cookieHeaderText, "cookie-header")}
                      />
                    ) : null}
                  </div>
                </div>
                {sessionText ? (
                  <textarea
                    readOnly
                    value={sessionText}
                    className="mt-3 h-32 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-700 outline-none"
                  />
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button disabled={loading} onClick={() => patch({ status: "PROCESSING" })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                处理中
              </button>
              <button disabled={loading} onClick={() => patch({ status: "INFO_INVALID" })} className="rounded-lg border border-rose-100 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                信息有误
              </button>
              <button disabled={loading} onClick={() => patch({ status: "COMPLETED" })} className="rounded-lg border border-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50">
                完成
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SessionCopyButton({
  disabled,
  loading = false,
  hasValue,
  copied,
  label,
  onClick,
}: {
  disabled?: boolean;
  loading?: boolean;
  hasValue: boolean;
  copied: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4" />
          已复制
        </>
      ) : hasValue ? (
        <>
          <CopyIcon className="h-4 w-4" />
          {label}
        </>
      ) : loading ? (
        "读取中"
      ) : (
        "读取 Session"
      )}
    </button>
  );
}

function StatusPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${className ?? "bg-slate-100 text-slate-600"}`}>
      {children}
    </span>
  );
}

function InfoBlock({
  label,
  value,
  copyKey,
  copied,
  onCopy,
  mono = false,
}: {
  label: string;
  value: string;
  copyKey?: string;
  copied?: string;
  onCopy?: (value: string, key: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={`mt-1 break-all text-sm font-semibold text-slate-950 ${mono ? "font-mono" : ""}`}>{value}</div>
      {copyKey && onCopy ? (
        <button
          type="button"
          onClick={() => onCopy(value, copyKey)}
          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
        >
          {copied === copyKey ? (
            <>
              <CheckIcon className="h-3.5 w-3.5 text-[var(--success)]" />
              已复制
            </>
          ) : (
            <>
              <CopyIcon className="h-3.5 w-3.5" />
              复制
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
