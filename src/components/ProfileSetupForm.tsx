"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileSetupForm({
  email,
  defaultInviteCode = "",
}: {
  email: string;
  defaultInviteCode?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState(defaultInviteCode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/account/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          inviteCode: inviteCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-14 max-w-[460px] px-4">
      <div className="rounded-[24px] border border-[var(--border)] bg-white px-7 py-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
        <div>
          <div className="text-sm font-semibold text-[var(--muted)]">{email}</div>
          <h1 className="mt-2 text-[32px] font-black leading-none tracking-tight text-slate-950">完善账户</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">设置一个用户名。邀请码没有可以不填。</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">用户名</span>
            <input
              className="input h-12 bg-white text-base"
              required
              maxLength={40}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="怎么称呼你"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">邀请码（可选）</span>
            <input
              className="input h-12 bg-white text-base uppercase tracking-wider"
              maxLength={32}
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="有邀请码就填"
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <button type="submit" disabled={loading} className="btn-primary h-12 w-full text-base">
            {loading ? "保存中..." : "进入首页"}
          </button>
        </form>
      </div>
    </div>
  );
}
