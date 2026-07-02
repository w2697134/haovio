"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { formatCnyBalance } from "@/lib/money";
import { LoginModal } from "@/components/LoginModal";
import { emitClientEvent, listenClientEvent } from "@/lib/clientEvents";

type IconName =
  | "home"
  | "support"
  | "wallet"
  | "user"
  | "gift"
  | "admin"
  | "orders"
  | "login"
  | "chevronDown"
  | "copy"
  | "settings"
  | "logout";

function NavIcon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      );
    case "support":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 0 1 16 0" />
          <rect x="2.5" y="12" width="3.5" height="6" rx="1.5" />
          <rect x="18" y="12" width="3.5" height="6" rx="1.5" />
          <path d="M20 18v.5a3 3 0 0 1-3 3h-3" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v2" />
          <path d="M4 7.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 1 4 7.5Z" />
          <path d="M17 14h.01" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <rect x="3.5" y="9" width="17" height="11" rx="1.5" />
          <path d="M3.5 13h17M12 9v11" />
          <path d="M12 9C9 9 7.5 7.5 7.5 6S9 4 10 5s2 4 2 4Zm0 0c3 0 4.5-1.5 4.5-3S15 4 14 5s-2 4-2 4Z" />
        </svg>
      );
    case "admin":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case "login":
      return (
        <svg {...common}>
          <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
          <path d="M14 12h7m0 0-3.5-3.5M21 12l-3.5 3.5" />
        </svg>
      );
    case "chevronDown":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "copy":
      return (
        <svg {...common}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
  }
}

function formatBalance(amount: number, compact = false) {
  return formatCnyBalance(amount, compact);
}

function WalletBalanceLink({ balance }: { balance: number }) {
  const fullBalanceText = formatBalance(balance);
  const balanceText = formatBalance(balance, true);

  return (
    <Link
      href="/buy-points"
      aria-label={`余额 ${fullBalanceText} 充值`}
      title={`余额 ${fullBalanceText}`}
      className="group relative inline-flex h-10 min-w-[112px] max-w-[150px] items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-white/70 px-3 text-[15px] font-medium !text-slate-600 shadow-sm transition visited:!text-slate-600 hover:border-slate-400 hover:bg-slate-100 hover:!text-slate-800 hover:shadow-md sm:h-11 sm:min-w-[132px] sm:max-w-[182px] sm:gap-2 sm:px-5"
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center">
        <NavIcon name="wallet" />
      </span>
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-black leading-none tabular-nums tracking-normal sm:text-base">
        {balanceText}
      </span>
      <span
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 opacity-0 shadow-sm transition before:absolute before:left-1/2 before:top-0 before:h-2 before:w-2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-45 before:border-l before:border-t before:border-[var(--border)] before:bg-white group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        充值
      </span>
    </Link>
  );
}

function AccountMenu({ user, active = false }: { user: SessionUser; active?: boolean }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const shortId = user.id.length > 10 ? user.id.slice(0, 10) : user.id;

  async function copyUserId() {
    await navigator.clipboard.writeText(user.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const buttonClass =
    "inline-flex min-w-32 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium transition " +
    (active
      ? "bg-slate-100 !text-slate-900 ring-1 ring-slate-200 shadow-sm"
      : "border border-[var(--border)] bg-white/70 !text-slate-600 visited:!text-slate-600 hover:!text-slate-900 hover:border-slate-300 hover:bg-white");

  const itemClass =
    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950";

  return (
    <div className="group/account relative">
      <button type="button" className={buttonClass} aria-haspopup="menu">
        <NavIcon name="user" />
        账户
        <span className="transition group-hover/account:rotate-180">
          <NavIcon name="chevronDown" />
        </span>
      </button>

      <div className="invisible absolute right-0 top-full z-50 w-72 translate-y-1 pt-3 opacity-0 transition group-hover/account:visible group-hover/account:translate-y-0 group-hover/account:opacity-100 group-focus-within/account:visible group-focus-within/account:translate-y-0 group-focus-within/account:opacity-100">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
                <NavIcon name="user" />
              </span>
              <span className="min-w-0 truncate text-base font-semibold text-slate-800">ID: {shortId}</span>
            </div>
            <button
              type="button"
              onClick={copyUserId}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              title={copied ? "已复制" : "复制 ID"}
            >
              <NavIcon name="copy" />
            </button>
          </div>

          <div className="space-y-1 p-3">
            <Link href="/buy-points" className={itemClass}>
              <NavIcon name="wallet" />
              充值
            </Link>
            <Link href="/account" className={itemClass}>
              <NavIcon name="settings" />
              设置
            </Link>
            <button type="button" onClick={logout} disabled={loggingOut} className={itemClass}>
              <NavIcon name="logout" />
              {loggingOut ? "退出中" : "退出"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header({ user, balance = 0 }: { user: SessionUser | null; balance?: number }) {
  const pathname = usePathname();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    function openLoginModal() {
      if (!user) setLoginOpen(true);
    }

    return listenClientEvent("openLoginModal", openLoginModal);
  }, [user]);

  function openCustomerService() {
    emitClientEvent("openCustomerService");
  }

  const baseClass =
    "inline-flex min-w-32 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium transition";
  const activeClass = "bg-slate-100 !text-slate-900 ring-1 ring-slate-200 shadow-sm";
  const idleClass =
    "border border-[var(--border)] bg-white/70 !text-slate-600 visited:!text-slate-600 hover:!text-slate-900 hover:border-slate-300 hover:bg-white";

  function pill(active: boolean) {
    return `${baseClass} ${active ? activeClass : idleClass}`;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur">
      <div className="relative flex h-20 w-full items-center px-5 sm:px-8 lg:px-10">
        <Link href="/" className="absolute left-5 flex shrink-0 items-center gap-2.5 sm:left-8 lg:left-10">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 place-items-center rounded-xl text-2xl font-black leading-none text-white shadow-sm ring-1 ring-white/30"
            style={{ background: "linear-gradient(135deg,#6366F1 0%,#A855F7 56%,#22D3EE 100%)" }}
          >
            维
          </span>
          <span className="text-xl font-black tracking-tight">
            <span className="text-slate-900">好维</span>{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
              AI
            </span>
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-12 lg:flex">
          <Link href="/" className={pill(pathname === "/")}>
            <NavIcon name="home" />
            首页
          </Link>
          <button type="button" onClick={openCustomerService} className={pill(false)}>
            <NavIcon name="support" />
            在线客服
          </button>

          {user && user.role !== "ADMIN" ? (
            <Link href="/invite" className={pill(pathname.startsWith("/invite"))}>
              <NavIcon name="gift" />
              邀请有礼
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 lg:flex">
          {user ? (
            <>
              <WalletBalanceLink balance={balance} />
              <AccountMenu user={user} active={pathname.startsWith("/account")} />
            </>
          ) : (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className={`${baseClass} bg-slate-100 !text-slate-900 ring-1 ring-slate-200 shadow-sm hover:bg-slate-200`}
            >
              <NavIcon name="login" />
              登录
            </button>
          )}
        </div>

        <div className="ml-auto flex gap-2 lg:hidden">
          {user ? <WalletBalanceLink balance={balance} /> : null}
          {!user ? (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              登录
            </button>
          ) : null}
          <button
            type="button"
            onClick={openCustomerService}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            客服
          </button>
        </div>
      </div>
      {!user ? <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} /> : null}
    </header>
  );
}
