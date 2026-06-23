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
  VOID: "作废",
};

const PRODUCT_LABEL: Record<string, string> = {
  PLUS: "Plus",
  PRO_5X: "Pro 5x",
  PRO_20X: "Pro 20x",
};

type Secret = { cookieJson: string; cookieHeader: string };

export function CardRedeemRow({ redeem }: { redeem: AdminCardRedeem }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secret, setSecret] = useState<Secret | null>(null);
  const [showSecret, setShowSecret] = useState(false);

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
        setError(data.error ?? "读取失败");
        return;
      }
      setSecret({ cookieJson: data.cookieJson, cookieHeader: data.cookieHeader });
      setShowSecret(true);
    } catch {
      setError("网络错误");
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

  const cookieOk = redeem.cookieMeta.formatStatus === "VALID_FORMAT";

  return (
    <div className="border-b border-[var(--border)] p-4 last:border-b-0">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-extrabold">{redeem.card.code}</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold">
              {PRODUCT_LABEL[redeem.card.productType] ?? redeem.card.productType}
            </span>
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {STATUS_LABEL[redeem.status] ?? redeem.status}
            </span>
          </div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            {contact || "-"} · Cookie {cookieOk ? "正常" : "异常"} ·{" "}
            {new Date(redeem.createdAt).toLocaleString("zh-CN")}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            disabled={loading || Boolean(redeem.cookieClearedAt)}
            onClick={revealSecret}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            Cookie
          </button>
          <button
            disabled={loading}
            onClick={() => patch({ status: "RECHARGED_PENDING_CANCEL" })}
            className="rounded-lg bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
          >
            已充
          </button>
          <button
            disabled={loading}
            onClick={() => patch({ status: "INFO_INVALID" })}
            className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            错误
          </button>
          <button
            disabled={loading}
            onClick={() => patch({ status: "COMPLETED", renewalStatus: "CANCELLED" })}
            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            完成
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}

      {showSecret && secret && (
        <div className="mt-3 grid gap-3 rounded-xl bg-[var(--surface-2)] p-3 lg:grid-cols-2">
          <div>
            <div className="mb-1 flex justify-end">
              <button onClick={() => copy(secret.cookieHeader)} className="text-sm font-semibold text-[var(--accent)]">
                复制
              </button>
            </div>
            <textarea readOnly className="input min-h-28 font-mono text-xs" value={secret.cookieHeader} />
          </div>
          <div>
            <div className="mb-1 flex justify-end">
              <button onClick={() => copy(secret.cookieJson)} className="text-sm font-semibold text-[var(--accent)]">
                复制
              </button>
            </div>
            <textarea readOnly className="input min-h-28 font-mono text-xs" value={secret.cookieJson} />
          </div>
        </div>
      )}
    </div>
  );
}
