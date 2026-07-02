import { notFound, redirect } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { PointProductRedeemForm } from "@/components/PointProductRedeemForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pointsForPrice } from "@/lib/points";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function RedeemPage({
  searchParams,
}: {
  searchParams: Promise<{ variantId?: string }>;
}) {
  const [{ variantId }, settings, sessionUser] = await Promise.all([
    searchParams,
    getSettings(),
    getCurrentUser(),
  ]);

  if (!sessionUser) redirect("/login");

  const [user, variant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { pointsBalance: true },
    }),
    variantId
      ? prisma.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true },
        })
      : null,
  ]);

  if (!user) redirect("/login");
  if (variantId && (!variant || variant.product.status !== "ACTIVE")) notFound();
  if (!variant) redirect("/buy-points");

  const supportContact =
    settings.contacts.find((contact) => contact.platform === "QQ群") ??
    settings.contacts.find((contact) => contact.platform === "QQ");
  const requiresSession = !variant.product.slug.includes("shared");

  return (
    <div className="relative px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-4 w-full max-w-6xl -translate-x-1/2 px-4">
        <div className="pointer-events-auto">
          <BackButton />
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        <PointProductRedeemForm
          variantId={variant.id}
          productName={variant.product.name}
          variantName={variant.name}
          pointsCost={pointsForPrice(variant.price)}
          priceCents={variant.price}
          currency={variant.currency}
          balance={user.pointsBalance}
          supportContact={supportContact}
          requiresSession={requiresSession}
        />
      </div>
    </div>
  );
}
