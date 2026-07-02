"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

type RedeemOrderCopyPanelProps = {
  orderId: string;
  details: string;
  createdAtText: string;
  qqGroupAccount: string | null;
  wechatAccount: string | null;
};

export function RedeemOrderCopyPanel({
  orderId,
  details,
  createdAtText,
  qqGroupAccount,
  wechatAccount,
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
    <div className="space-y-5 text-left">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="text-sm font-black text-emerald-800">人工交付中</div>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          订单已扣款成功，通常 10-30 分钟内处理。高峰期可能稍慢，群主或客服会按订单号核对处理。
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="text-sm font-black text-[var(--foreground)]">订单号</div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 break-all rounded-xl bg-[var(--surface-2)] px-4 py-3 font-mono text-lg font-bold text-[var(--foreground)] ring-1 ring-[var(--border)]">
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
        <div className="mt-4 text-sm text-[var(--muted)]">{details}</div>
        <div className="mt-2 text-xs text-[var(--muted)]">提交时间：{createdAtText}</div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="text-sm font-black text-[var(--foreground)]">有问题找这里</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ContactCopyCard
            label="售后群"
            value={qqGroupAccount}
            emptyText="售后群暂未配置"
            copied={copied === "group"}
            onCopy={(value) => copy(value, "group")}
          />
          <ContactCopyCard
            label="客服微信"
            value={wechatAccount}
            emptyText="客服微信暂未配置"
            copied={copied === "wechat"}
            onCopy={(value) => copy(value, "wechat")}
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          复制订单号后发到售后群问群主；不方便进群的话，加客服微信说明订单号和问题。
        </p>
      </div>
    </div>
  );
}

function ContactCopyCard({
  label,
  value,
  emptyText,
  copied,
  onCopy,
}: {
  label: string;
  value: string | null;
  emptyText: string;
  copied: boolean;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="text-xs font-semibold text-[var(--muted)]">{label}</div>
      {value ? (
        <>
          <div className="mt-2 break-all font-mono text-xl font-black text-[var(--foreground)]">{value}</div>
          <button
            type="button"
            onClick={() => onCopy(value)}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[var(--surface-2)]"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 text-[var(--success)]" />
                已复制
              </>
            ) : (
              "复制"
            )}
          </button>
        </>
      ) : (
        <div className="mt-2 text-sm text-[var(--muted)]">{emptyText}</div>
      )}
    </div>
  );
}
