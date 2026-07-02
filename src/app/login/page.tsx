import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.name?.trim() ? "/" : "/profile-setup");
  const { ref } = await searchParams;
  return <AuthForm mode="login" defaultInviteCode={ref ?? ""} />;
}
