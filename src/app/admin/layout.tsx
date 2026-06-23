import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin", label: "待处理" },
  { href: "/admin/card-codes", label: "卡密" },
  { href: "/admin/settings", label: "设置" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin-login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-extrabold">后台</h1>

        <nav className="flex flex-wrap gap-2 sm:ml-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-[var(--border)] bg-white px-5 py-2 text-sm font-semibold hover:border-[var(--primary)] hover:text-[var(--accent)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] sm:ml-auto"
        >
          前台 →
        </Link>
      </header>

      {children}
    </div>
  );
}
