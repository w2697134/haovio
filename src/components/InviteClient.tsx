"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

function CopyButton({ value, label = "复制" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={label}
      aria-label={label}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800"
    >
      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
    </button>
  );
}

export function InviteShareCard({
  inviteCode,
  shareLink,
}: {
  inviteCode: string;
  shareLink: string;
}) {
  return (
    <div className="card space-y-4 p-5">
      <div>
        <div className="mb-1 text-sm text-[var(--muted)]">我的邀请码</div>
        <div className="flex items-center gap-3">
          <span className="flex-1 rounded-lg bg-[var(--surface-2)] px-4 py-2 font-mono text-lg font-medium tracking-widest">
            {inviteCode}
          </span>
          <CopyButton value={inviteCode} label="复制邀请码" />
        </div>
      </div>
      <div>
        <div className="mb-1 text-sm text-[var(--muted)]">邀请链接</div>
        <div className="flex items-center gap-3">
          <span className="flex-1 truncate rounded-lg bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--muted)]">
            {shareLink}
          </span>
          <CopyButton value={shareLink} label="复制链接" />
        </div>
      </div>
    </div>
  );
}
