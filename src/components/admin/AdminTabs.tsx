"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "总订单" },
  { href: "/admin/pending", label: "待处理" },
  { href: "/admin/products", label: "商品" },
  { href: "/admin/questions", label: "问题" },
  { href: "/admin/settings", label: "设置" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-end gap-8">
      {tabs.map((tab) => {
        const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              "border-b-2 px-8 py-5 text-base font-bold transition " +
              (active
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--foreground)] hover:text-[var(--primary)]")
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
