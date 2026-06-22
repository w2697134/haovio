import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductDetail } from "@/components/ProductDetail";
import type { AccountField } from "@/components/CartProvider";
import { getProductImage } from "@/lib/productImages";

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
  const detailVariants = selectedVariant ? [selectedVariant] : [];

  let accountFields: AccountField[] = [];
  try {
    accountFields = JSON.parse(product.accountFields);
  } catch {}

  const detail = {
    slug: product.slug,
    name: product.name,
    description: product.description,
    region: product.region,
    deliveryType: product.deliveryType,
    image: getProductImage(product.slug, product.image),
    accountFields,
    variants: detailVariants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      currency: v.currency,
      stock: v.stock,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-5 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--foreground)]">首页</Link>
        {" / "}
        <Link href={`/c/${product.category.slug}`} className="hover:text-[var(--foreground)]">
          {product.category.name}
        </Link>
        {" / "}
        <span className="text-[var(--foreground)]">{product.name}</span>
      </nav>

      <ProductDetail product={detail} initialVariantId={initialVariantId} />
    </div>
  );
}
