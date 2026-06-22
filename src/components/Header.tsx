"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import type { SessionUser } from "@/lib/auth";

export function Header({ user }: { user: SessionUser | null }) {
  const { count } = useCart();
  const router = useRouter();

  function openCustomerService() {
    window.dispatchEvent(new Event("open-customer-service"));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white ring-1 ring-[var(--border)]">
            <Image src="/images/haovio-logo.svg" alt="haovio" width={24} height={24} />
          </span>
          <span>GPT 会员</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--foreground)]">首页</Link>
          <Link href="/c/subscriptions" className="hover:text-[var(--foreground)]">会员订阅</Link>
          <button type="button" onClick={openCustomerService} className="hover:text-[var(--foreground)]">
            在线客服
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
          <button
            type="button"
            onClick={openCustomerService}
            className="rounded-lg px-3 py-2 font-medium text-[var(--accent)] hover:bg-[var(--surface)] md:hidden"
          >
            客服
          </button>
          <Link href="/cart" className="relative rounded-lg px-3 py-2 hover:bg-[var(--surface)]">
            🛒 购物车
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--primary)] px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {user?.role === "ADMIN" ? (
            <div className="flex items-center gap-2">
              <Link href="/admin" className="rounded-lg px-3 py-2 text-[var(--accent)] hover:bg-[var(--surface)]">
                管理后台
              </Link>
              <Link href="/admin/orders" className="rounded-lg px-3 py-2 hover:bg-[var(--surface)]">
                订单管理
              </Link>
              <button onClick={logout} className="rounded-lg px-3 py-2 text-[var(--muted)] hover:bg-[var(--surface)]">
                退出
              </button>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link href="/invite" className="rounded-lg px-3 py-2 text-[var(--accent)] hover:bg-[var(--surface)]">
                邀请有礼
              </Link>
              <Link href="/orders" className="rounded-lg px-3 py-2 hover:bg-[var(--surface)]">
                我的订单
              </Link>
              <button onClick={logout} className="rounded-lg px-3 py-2 text-[var(--muted)] hover:bg-[var(--surface)]">
                退出
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-primary px-4 py-2">
                登录
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
