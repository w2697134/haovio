"use client";

import { useEffect, useState } from "react";

type EmailBindFormProps = {
  initialEmail: string;
  verified: boolean;
};

type Message = {
  kind: "ok" | "error";
  text: string;
};

export function EmailBindForm({ initialEmail, verified }: EmailBindFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function sendCode() {
    if (loading || cooldown > 0) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (typeof data.retryAfter === "number") {
          setCooldown(data.retryAfter);
        }
        setMessage({ kind: "error", text: data.error ?? "发送失败" });
        return;
      }
      setSent(true);
      setCooldown(60);
      setMessage({ kind: "ok", text: "验证码已发送，请查看邮箱" });
    } catch {
      setMessage({ kind: "error", text: "网络错误，请稍后重试" });
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error ?? "验证失败" });
        return;
      }
      setMessage({ kind: "ok", text: "邮箱已绑定" });
      setSent(false);
      setCode("");
    } catch {
      setMessage({ kind: "error", text: "网络错误，请稍后重试" });
    } finally {
      setLoading(false);
    }
  }

  const sendButtonText = loading ? "处理中..." : cooldown > 0 ? `${cooldown} 秒后重发` : "发送验证码";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-black">绑定邮箱</div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {verified ? "当前邮箱已验证" : "用于接收验证码、订单和返利通知"}
          </div>
        </div>
        <span
          className={
            "rounded-full px-3 py-1 text-xs font-bold " +
            (verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
          }
        >
          {verified ? "已验证" : "未验证"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSent(false);
            setCode("");
            setMessage(null);
          }}
          placeholder="填写邮箱"
          disabled={loading}
        />
        <button
          type="button"
          onClick={sendCode}
          disabled={loading || cooldown > 0}
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--surface-2)] disabled:opacity-60"
        >
          {sendButtonText}
        </button>
      </div>

      {sent ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            className="input"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="输入6位验证码"
            disabled={loading}
          />
          <button
            type="button"
            onClick={verifyCode}
            disabled={loading || code.length !== 6}
            className="btn-primary px-4 py-2.5 text-sm disabled:opacity-60"
          >
            确认绑定
          </button>
        </div>
      ) : null}

      {message ? (
        <div
          className={
            "mt-3 rounded-lg border p-3 text-sm font-semibold " +
            (message.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700")
          }
        >
          {message.text}
        </div>
      ) : null}
    </div>
  );
}
