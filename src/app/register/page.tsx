import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const { ref } = await searchParams;
  return <AuthForm mode="register" defaultInviteCode={ref ?? ""} />;
}
