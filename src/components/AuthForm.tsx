"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthForm({
  mode,
  defaultInviteCode = "",
}: {
  mode: "login" | "register";
  defaultInviteCode?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState(defaultInviteCode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin
            ? { email, password }
            : { email, password, name, inviteCode: inviteCode.trim() || undefined }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "操作失败");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">{isLogin ? "登录" : "注册账户"}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {isLogin ? "欢迎回来,继续你的充值" : "创建账户即可下单充值"}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">昵称(可选)</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的称呼"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">邮箱</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">密码</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "请输入密码" : "至少 6 位"}
            />
          </div>
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">邀请码(可选)</label>
              <input
                className="input"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="填写邀请码, 注册即得优惠券"
              />
            </div>
          )}

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "处理中..." : isLogin ? "登录" : "注册"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          {isLogin ? (
            <>
              还没有账户?{" "}
              <Link href="/register" className="text-[var(--accent)]">立即注册</Link>
            </>
          ) : (
            <>
              已有账户?{" "}
              <Link href="/login" className="text-[var(--accent)]">去登录</Link>
            </>
          )}
        </p>

      </div>
    </div>
  );
}
