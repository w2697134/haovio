"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "登录失败");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <div className="card overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-8 py-6">
          <div className="text-sm font-semibold text-[var(--accent)]">GPT 会员后台</div>
          <h1 className="mt-2 text-2xl font-bold">管理后台登录</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            订单处理、商品价格和联系方式设置只允许管理员进入。
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 p-8">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">管理员密钥</label>
            <input
              className="input"
              type="password"
              required
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="输入后台密钥"
            />
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "登录中..." : "进入后台"}
          </button>

          <p className="text-center text-xs text-[var(--muted)]">
            密钥验证通过后直接进入后台。
          </p>
        </form>
      </div>
    </div>
  );
}
