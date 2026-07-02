"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-[var(--surface-2)] hover:text-slate-900 disabled:opacity-60"
    >
      {loading ? "退出中..." : "退出登录"}
    </button>
  );
}
