import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin-login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2 border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-bold">🔧 管理后台</h1>
        <nav className="ml-6 flex gap-1 text-sm">
          <Link href="/admin" className="rounded-lg px-3 py-1.5 hover:bg-[var(--surface)]">概览</Link>
          <Link href="/admin/orders" className="rounded-lg px-3 py-1.5 hover:bg-[var(--surface)]">订单</Link>
          <Link href="/admin/card-codes" className="rounded-lg px-3 py-1.5 hover:bg-[var(--surface)]">卡密</Link>
          <Link href="/admin/card-redeems" className="rounded-lg px-3 py-1.5 hover:bg-[var(--surface)]">兑换</Link>
          <Link href="/admin/products" className="rounded-lg px-3 py-1.5 hover:bg-[var(--surface)]">商品</Link>
          <Link href="/admin/questions" className="rounded-lg px-3 py-1.5 hover:bg-[var(--surface)]">问题</Link>
          <Link href="/admin/settings" className="rounded-lg px-3 py-1.5 hover:bg-[var(--surface)]">设置</Link>
        </nav>
        <Link href="/" className="ml-auto text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          返回前台 →
        </Link>
      </div>
      {children}
    </div>
  );
}
