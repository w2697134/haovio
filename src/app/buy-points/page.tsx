import { redirect } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { PointPurchaseForm } from "@/components/PointPurchaseForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BuyPointsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="relative px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-4 w-full max-w-6xl -translate-x-1/2 px-4">
        <div className="pointer-events-auto">
          <BackButton />
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        <PointPurchaseForm />
      </div>
    </div>
  );
}
