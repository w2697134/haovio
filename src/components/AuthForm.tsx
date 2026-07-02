"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthForm({
  defaultInviteCode = "",
  variant = "page",
}: {
  mode: "login" | "register";
  defaultInviteCode?: string;
  variant?: "page" | "modal";
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [inviteCode] = useState(defaultInviteCode);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function resetNotice() {
    setError("");
    setMessage("");
  }

  async function sendEmailCode() {
    if (sendingCode || cooldown > 0) return;
    resetNotice();
    setSendingCode(true);

    try {
      const res = await fetch("/api/auth/login/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (typeof data.retryAfter === "number") setCooldown(data.retryAfter);
        setError(data.error ?? "验证码发送失败");
        return;
      }
      setCooldown(60);
      setMessage("验证码已发送，请查看邮箱");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSendingCode(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    resetNotice();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          emailCode,
          inviteCode: inviteCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "登录失败");
        return;
      }

      const ref = inviteCode.trim();
      router.push(data.needsProfile ? `/profile-setup${ref ? `?ref=${encodeURIComponent(ref)}` : ""}` : "/");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  const sendCodeText = sendingCode ? "发送中" : cooldown > 0 ? `${cooldown}秒` : "发送验证码";
  const isModal = variant === "modal";

  return (
    <div className={isModal ? "w-full" : "flex min-h-[calc(100vh-80px)] justify-center px-4 pb-12 pt-20 sm:pt-24"}>
      <div className="w-full max-w-[360px]">
        <div className={isModal ? "mb-5 flex justify-center" : "mb-6 flex justify-center"}>
          <div
            className="grid h-11 w-11 place-items-center rounded-2xl text-2xl font-black leading-none text-white shadow-sm ring-1 ring-white/40"
            style={{ background: "linear-gradient(135deg,#6366F1 0%,#A855F7 56%,#22D3EE 100%)" }}
          >
            维
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-950">登录或注册</h1>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              aria-label="电子邮箱"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                resetNotice();
              }}
              placeholder="电子邮箱"
            />

            <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">
              <input
                aria-label="验证码"
                className="min-w-0 flex-1 border-0 bg-transparent px-4 text-[15px] font-medium text-slate-950 outline-none placeholder:text-slate-400"
                inputMode="numeric"
                maxLength={6}
                required
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="验证码"
              />
              <button
                type="button"
                onClick={sendEmailCode}
                disabled={sendingCode || cooldown > 0}
                className="mr-1.5 h-9 shrink-0 rounded-lg border border-indigo-100 bg-indigo-50 px-3.5 text-sm font-semibold text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {sendCodeText}
              </button>
            </div>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          ) : null}

          <button type="submit" disabled={loading} className="btn-primary h-12 w-full rounded-xl text-base">
            {loading ? "处理中..." : "登录或注册"}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
