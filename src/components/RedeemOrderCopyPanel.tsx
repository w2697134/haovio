"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

type RedeemOrderCopyPanelProps = {
  orderId: string;
  details: string;
  createdAtText: string;
  supportLabel: string;
  supportAccount: string | null;
  handlerName: string;
};

export function RedeemOrderCopyPanel({
  orderId,
  details,
  createdAtText,
  supportLabel,
  supportAccount,
  handlerName,
}: RedeemOrderCopyPanelProps) {
  const [copied, setCopied] = useState("");

  async function copy(text: string, tag: string) {
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
    setCopied(tag);
    window.setTimeout(() => setCopied(""), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
        <div className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">订单号</div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 break-all rounded-xl bg-white px-4 py-3 font-mono text-lg font-bold text-[var(--foreground)] ring-1 ring-[var(--border)]">
            {orderId}
          </div>
          <button
            type="button"
            onClick={() => copy(orderId, "order")}
            className="btn-primary inline-flex shrink-0 items-center justify-center gap-1.5 px-5 py-3 text-sm"
          >
            {copied === "order" ? (
              <>
                <CheckIcon className="h-4 w-4" />
                已复制
              </>
            ) : (
              "复制订单号"
            )}
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
          复制后发给{handlerName}，对方按这个订单号处理。
        </p>
        <div className="mt-3 text-sm text-[var(--muted)]">{details}</div>
        <div className="mt-2 text-xs text-[var(--muted)]">提交时间：{createdAtText}</div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="text-sm font-semibold text-[var(--foreground)]">{supportLabel}</div>
        {supportAccount ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <div className="break-all font-mono text-2xl font-black text-[var(--accent)]">
              {supportAccount}
            </div>
            <button
              type="button"
              onClick={() => copy(supportAccount, "contact")}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--surface-2)]"
            >
              {copied === "contact" ? (
                <>
                  <CheckIcon className="h-4 w-4 text-[var(--success)]" />
                  已复制
                </>
              ) : (
                "复制联系方式"
              )}
            </button>
          </div>
        ) : (
          <div className="mt-3 text-sm text-[var(--muted)]">暂未配置</div>
        )}
        <p className="mt-3 text-sm text-[var(--muted)]">
          先复制订单号，再把订单号发给{handlerName}。
        </p>
      </div>
    </div>
  );
}
