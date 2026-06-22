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
  PROCESSING: "处理中",
  RECHARGED_PENDING_CANCEL: "已充值，待取消续订",
  COMPLETED: "已取消续订，完成",
  INFO_INVALID: "信息有误",
  VOID: "已作废",
};

const RENEWAL_LABEL: Record<string, string> = {
  PENDING_CANCEL: "待取消续订",
  CANCELLED: "已取消续订",
  NOT_NEEDED: "无需取消",
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
      setShowSecret((v) => !v);
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

  async function clearCookie() {
    const ok = window.confirm("确认清除这条记录里的 Cookie 原文？清除后无法在后台恢复。");
    if (!ok) return;
    await patch({ clearCookie: true });
    setSecret(null);
    setShowSecret(false);
  }

  const contact = [redeem.contactQq ? "QQ " + redeem.contactQq : "", redeem.contactWechat ? "微信 " + redeem.contactWechat : ""]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="border-b border-[var(--border)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold">{redeem.card.code}</span>
            <span className="rounded bg-[var(--primary)]/15 px-2 py-0.5 text-xs text-[var(--accent)]">
              {redeem.card.productType}
            </span>
            <span className="rounded bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--muted)]">
              {STATUS_LABEL[redeem.status] ?? redeem.status}
            </span>
            <span className="rounded bg-[var(--warning)]/15 px-2 py-0.5 text-xs text-[var(--warning)]">
              {RENEWAL_LABEL[redeem.renewalStatus] ?? redeem.renewalStatus}
            </span>
          </div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            {contact || "无联系方式"} · {new Date(redeem.createdAt).toLocaleString("zh-CN")}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            Cookie {redeem.cookieMeta.count} 条 · 域名 {redeem.cookieMeta.domains.join(", ") || "-"} ·
            检测 {redeem.cookieMeta.formatStatus}
            {redeem.cookieClearedAt ? " · 原文已清除" : ""}
            {redeem.clearAfterAt ? " · 建议清理 " + new Date(redeem.clearAfterAt).toLocaleDateString("zh-CN") : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={loading} onClick={() => patch({ status: "PROCESSING" })} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--surface-2)]">
            处理中
          </button>
          <button disabled={loading} onClick={() => patch({ status: "RECHARGED_PENDING_CANCEL" })} className="rounded-lg border border-[var(--warning)] px-3 py-1.5 text-xs text-[var(--warning)] hover:bg-[var(--warning)]/10">
            已充值待取消
          </button>
          <button disabled={loading} onClick={() => patch({ status: "COMPLETED", renewalStatus: "CANCELLED" })} className="rounded-lg border border-[var(--success)] px-3 py-1.5 text-xs text-[var(--success)] hover:bg-[var(--success)]/10">
            已取消续订完成
          </button>
          <button disabled={loading} onClick={() => patch({ status: "INFO_INVALID" })} className="rounded-lg border border-[var(--danger)] px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10">
            信息有误
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
        <textarea
          className="input min-h-20 text-sm"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="处理备注，例如闲鱼订单号、充值情况、取消续订情况"
        />
        <div className="flex flex-wrap items-start gap-2">
          <button disabled={loading} onClick={() => patch({ adminNote: adminNote || null })} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface-2)]">
            保存备注
          </button>
          <button disabled={loading || Boolean(redeem.cookieClearedAt)} onClick={revealSecret} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface-2)] disabled:opacity-50">
            {showSecret ? "隐藏 Cookie" : "查看 Cookie"}
          </button>
          <button disabled={loading || Boolean(redeem.cookieClearedAt)} onClick={clearCookie} className="rounded-lg border border-[var(--danger)] px-3 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 disabled:opacity-50">
            清除 Cookie
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}

      {showSecret && secret && (
        <div className="mt-3 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>规范化 Cookie Header</span>
              <button onClick={() => copy(secret.cookieHeader)} className="text-[var(--accent)]">复制</button>
            </div>
            <textarea readOnly className="input min-h-24 font-mono text-xs" value={secret.cookieHeader} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>原始 edit-cookie JSON</span>
              <button onClick={() => copy(secret.cookieJson)} className="text-[var(--accent)]">复制</button>
            </div>
            <textarea readOnly className="input min-h-40 font-mono text-xs" value={secret.cookieJson} />
          </div>
        </div>
      )}
    </div>
  );
}
