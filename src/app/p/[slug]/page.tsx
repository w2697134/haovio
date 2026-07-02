import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const initialVariantId = Array.isArray(query.v) ? query.v[0] : query.v;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product || product.status !== "ACTIVE") notFound();

  const selectedVariant = product.variants.find((v) => v.id === initialVariantId) ?? product.variants[0];
  if (!selectedVariant) notFound();

  const redirectParams = new URLSearchParams({
    productSlug: product.slug,
    product: product.name,
    variant: selectedVariant.name,
    variantId: selectedVariant.id,
    qty: "1",
  });

  redirect(`/redeem?${redirectParams.toString()}`);
}
