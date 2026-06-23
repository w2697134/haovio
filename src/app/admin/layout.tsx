import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminTabs } from "@/components/admin/AdminTabs";

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
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-end gap-10 border-b border-[var(--border)]">
        <h1 className="pb-5 text-5xl font-extrabold tracking-tight">后台</h1>
        <AdminTabs />
      </div>

      {children}
    </div>
  );
}
