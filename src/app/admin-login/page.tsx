import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");

  return <AdminLoginForm />;
}
