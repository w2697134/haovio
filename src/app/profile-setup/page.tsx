import { redirect } from "next/navigation";
import { ProfileSetupForm } from "@/components/ProfileSetupForm";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.name?.trim()) redirect("/");

  const { ref } = await searchParams;
  return <ProfileSetupForm email={user.email} defaultInviteCode={ref ?? ""} />;
}
