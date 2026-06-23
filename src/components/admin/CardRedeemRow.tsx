"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminCardRedeem = {
  id: string;
  status: string;
  contactQq: string | null;
  contactWechat: string | null;
  cookieMeta: {
    count: number;
    domains: string[];
    totalValueChars: number;
    formatStatus: string;
    issues: string[];
  };
  cookieClearedAt: string | null;
  clearAfterAt: string | null;
  renewalStatus: string;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
  completedAt: string | null;
  card: {
    code: string;
    productType: string;
    batchName: string | null;
    status: string;
  };
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待处理",
  PROCESSING: "待处理",
  RECHARGED_PENDING_CANCEL: "已充值",
  COMPLETED: "已完成",
  INFO_INVALID: "资料错误",
  VOID: "已作废",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PROCESSING: "bg-amber-50 text-amber-700 border-amber-200",
  RECHARGED_PENDING_CANCEL: "bg-cyan-50 text-cyan-700 border-cyan-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INFO_INVALID: "bg-rose-50 text-rose-700 border-rose-200",
  VOID: "bg-slate-50 text-slate-600 border-slate-200",
};

type Secret = { cookieJson: string; cookieHeader: string };

export function CardRedeemRow({ redeem }: { redeem: AdminCardRedeem }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secret, setSecret] = useState<Secret | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [adminNote, setAdminNote] = useState(redeem.adminNote ?? "");

  async function patch(payload: Record<string, unknown>) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/card-redeems/" + redeem.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "操作失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function revealSecret() {
    if (secret) {
      setShowSecret((value) => !value);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/card-redeems/" + redeem.id + "/secret");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "读取 Cookie 失败");
        return;
      }
      setSecret({ cookieJson: data.cookieJson, cookieHeader: data.cookieHeader });
      setShowSecret(true);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  const contact = [
    redeem.contactQq ? "QQ " + redeem.contactQq : "",
    redeem.contactWechat ? "微信 " + redeem.contactWechat : "",
  ]
    .filter(Boolean)
    .join(" / ");

  const statusClass = STATUS_CLASS[redeem.status] ?? "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="border-b border-[var(--border)] p-4 last:border-b-0">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-extrabold">{redeem.card.code}</span>
            <span className="rounded-lg bg-[var(--primary)]/10 px-2 py-1 text-xs font-semibold text-[var(--accent)]">
              {redeem.card.productType}
            </span>
            <span className={"rounded-lg border px-2 py-1 text-xs font-semibold " + statusClass}>
              {STATUS_LABEL[redeem.status] ?? redeem.status}
            </span>
          </div>

          <div className="text-sm text-[var(--muted)]">
            {contact || "无联系方式"} · {new Date(redeem.createdAt).toLocaleString("zh-CN")}
          </div>

          <div className="text-xs text-[var(--muted)]">
            Cookie {redeem.cookieMeta.count} 条 · {redeem.cookieMeta.domains.join(", ") || "-"} ·
            {redeem.cookieMeta.formatStatus === "VALID_FORMAT" ? " 格式正常" : " 格式异常"}
            {redeem.cookieClearedAt ? " · Cookie 已清除" : ""}
          </div>

          {redeem.cookieMeta.issues.length > 0 && (
            <div className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
              {redeem.cookieMeta.issues.join(" / ")}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-start gap-2 lg:justify-end">
          <button
            disabled={loading || Boolean(redeem.cookieClearedAt)}
            onClick={revealSecret}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {showSecret ? "隐藏 Cookie" : "查看 Cookie"}
          </button>
          <button
            disabled={loading}
            onClick={() => patch({ status: "RECHARGED_PENDING_CANCEL" })}
            className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
          >
            标记已充值
          </button>
          <button
            disabled={loading}
            onClick={() => patch({ status: "INFO_INVALID" })}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            资料错误
          </button>
          <button
            disabled={loading}
            onClick={() => patch({ status: "COMPLETED", renewalStatus: "CANCELLED" })}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            完成
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_auto]">
        <textarea
          className="input min-h-16 text-sm"
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder="备注"
        />
        <button
          disabled={loading}
          onClick={() => patch({ adminNote: adminNote || null })}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-2)]"
        >
          保存备注
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}

      {showSecret && secret && (
        <div className="mt-3 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 lg:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Cookie Header</span>
              <button onClick={() => copy(secret.cookieHeader)} className="text-[var(--accent)]">
                复制
              </button>
            </div>
            <textarea readOnly className="input min-h-32 font-mono text-xs" value={secret.cookieHeader} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>edit-cookie JSON</span>
              <button onClick={() => copy(secret.cookieJson)} className="text-[var(--accent)]">
                复制
              </button>
            </div>
            <textarea readOnly className="input min-h-32 font-mono text-xs" value={secret.cookieJson} />
          </div>
        </div>
      )}
    </div>
  );
}
