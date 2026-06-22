"use client";

import { useState } from "react";
import type { Contact } from "@/lib/settings";

const PLATFORM_ICON: Record<string, string> = {
  QQ: "🐧",
  QQ群: "🐧",
  Telegram: "✈️",
  WhatsApp: "📱",
  邮箱: "📧",
};

export function OrderSuccessPanel({
  orderNo,
  contacts,
}: {
  orderNo: string;
  contacts: Contact[];
}) {
  const [copied, setCopied] = useState("");

  async function copy(text: string, tag: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(tag);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[var(--success)]/10 p-5">
        <div className="text-lg font-bold text-[var(--success)]">下单成功</div>
        <div className="mt-3 text-xs text-[var(--muted)]">订单号</div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className="flex-1 font-mono text-2xl font-bold tracking-wide">{orderNo}</span>
          <button
            onClick={() => copy(orderNo, "no")}
            className="btn-primary shrink-0 px-4 py-2 text-sm"
          >
            {copied === "no" ? "✓ 已复制" : "复制单号"}
          </button>
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">添加 QQ 时发送这个订单号。</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] p-4">
        <div className="mb-3 font-semibold">联系方式</div>
        {contacts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            商家尚未配置联系方式,请稍后再试。
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((c, i) => (
              <div
                key={i}
                className="rounded-lg bg-[var(--surface-2)] p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{PLATFORM_ICON[c.platform] ?? "🔗"}</span>
                  <div className="flex-1">
                    <div className="text-xs text-[var(--muted)]">{c.platform}</div>
                    <div className="font-mono font-medium">{c.account}</div>
                  </div>
                  <button
                    onClick={() => copy(c.account, `c${i}`)}
                    className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--surface)]"
                  >
                    {copied === `c${i}` ? "✓ 已复制" : "复制"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
