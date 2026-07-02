import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.name?.trim() ? "/" : "/profile-setup");
  const { ref } = await searchParams;
  redirect(ref ? `/login?ref=${encodeURIComponent(ref)}` : "/login");
}
