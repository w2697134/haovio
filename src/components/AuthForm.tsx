"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Stage = "email" | "code" | "register" | "password";
type AccountMode = "existing" | "new" | null;

export function AuthForm({
  defaultInviteCode = "",
  variant = "page",
}: {
  mode?: "login" | "register";
  defaultInviteCode?: string;
  variant?: "page" | "modal";
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [accountMode, setAccountMode] = useState<AccountMode>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState(defaultInviteCode);
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

  function routeAfterLogin(data: { needsProfile?: boolean }) {
    const ref = inviteCode.trim();
    router.push(data.needsProfile ? `/profile-setup${ref ? `?ref=${encodeURIComponent(ref)}` : ""}` : "/");
    router.refresh();
  }

  async function requestEmailCode({ nextStage = "code" }: { nextStage?: Stage } = {}) {
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
        return false;
      }
      setCooldown(60);
      setCodeSent(true);
      setEmailCode("");
      setStage(nextStage);
      return true;
    } catch {
      setError("网络错误，请稍后重试");
      return false;
    } finally {
      setSendingCode(false);
    }
  }

  async function continueWithEmail() {
    resetNotice();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "邮箱检查失败");
        return;
      }

      if (data.exists) {
        setAccountMode("existing");
        setCodeSent(false);
        setEmailCode("");
        setPassword("");
        setStage("code");
        return;
      }

      setAccountMode("new");
      setCodeSent(false);
      await requestEmailCode({ nextStage: "code" });
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function submitCode() {
    if (!codeSent) {
      setError("请先发送验证码");
      return;
    }

    resetNotice();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, emailCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "验证码不正确");
        return;
      }
      if (data.needsRegistration) {
        setMessage("请补全账号信息。");
        setStage("register");
        return;
      }
      routeAfterLogin(data);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function submitRegistration() {
    resetNotice();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          emailCode,
          name,
          password,
          inviteCode: inviteCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "注册失败");
        return;
      }
      routeAfterLogin(data);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function submitPasswordLogin() {
    resetNotice();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "登录失败");
        return;
      }
      routeAfterLogin(data);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stage === "email") void continueWithEmail();
    if (stage === "code") void submitCode();
    if (stage === "register") void submitRegistration();
    if (stage === "password") void submitPasswordLogin();
  }

  function showPasswordLogin() {
    resetNotice();
    setPassword("");
    setStage("password");
  }

  const isModal = variant === "modal";
  const title =
    stage === "password" ? "密码登录" : stage === "register" ? "完善账号" : stage === "code" ? "输入验证码" : "登录或注册";
  const busy = loading || sendingCode;
  const canResend = !busy && cooldown <= 0;

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
          <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              aria-label="电子邮箱"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-500"
              type="email"
              required
              disabled={stage !== "email"}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                resetNotice();
              }}
              placeholder="电子邮箱"
            />

            {stage === "code" ? (
              <>
                {accountMode === "existing" ? (
                  <button
                    type="button"
                    onClick={() => void requestEmailCode({ nextStage: "code" })}
                    disabled={!canResend}
                    className="h-11 w-full rounded-xl border border-indigo-100 bg-indigo-50 px-4 text-sm font-semibold text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingCode ? "发送中..." : cooldown > 0 ? `${cooldown} 秒后可重发` : codeSent ? "重新发送验证码" : "发送验证码"}
                  </button>
                ) : null}
                <input
                  aria-label="验证码"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 位邮箱验证码"
                />
              </>
            ) : null}

            {stage === "register" ? (
              <>
                <input
                  aria-label="用户名"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="用户名"
                />
                <input
                  aria-label="设置密码"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="设置密码"
                />
                <input
                  aria-label="邀请码"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="邀请码（选填）"
                />
              </>
            ) : null}

            {stage === "password" ? (
              <input
                aria-label="密码"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
              />
            ) : null}

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

            <button type="submit" disabled={busy} className="btn-primary h-12 w-full rounded-xl text-base">
              {busy
                ? "处理中..."
                : stage === "email"
                  ? "继续"
                  : stage === "code"
                    ? "验证并继续"
                    : stage === "register"
                      ? "完成注册"
                      : "登录"}
            </button>
          </form>

          {stage === "code" && accountMode === "existing" ? (
            <button
              type="button"
              onClick={showPasswordLogin}
              className="mt-4 w-full text-center text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
            >
              用密码登录
            </button>
          ) : null}

          {stage === "password" ? (
            <button
              type="button"
              onClick={() => {
                setPassword("");
                setStage("code");
                resetNotice();
              }}
              className="mt-4 w-full text-center text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
            >
              用验证码登录
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
