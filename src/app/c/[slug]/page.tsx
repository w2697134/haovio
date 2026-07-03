import { notFound } from "next/navigation";
import { TierCard } from "@/components/TierCard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProductSectionTitle, toTierCardProduct, toTierCardVariant } from "@/lib/tierCardData";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [category, user] = await Promise.all([
    prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: "ACTIVE" },
          orderBy: { sortOrder: "asc" },
          include: { variants: { orderBy: { price: "asc" } } },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="relative text-3xl font-black tracking-tight sm:text-4xl">
          <span
            aria-hidden="true"
            className="absolute left-[-14px] top-1/2 h-[0.78em] w-1.5 -translate-y-1/2 rounded-full bg-[var(--primary)]"
          />
          {category.icon} {category.name}
        </h1>
      </div>

      {category.products.length === 0 ? (
        <p className="py-20 text-center text-[var(--muted)]">该分类暂无商品</p>
      ) : (
        <div className="grid gap-8">
          {category.products.map((product) => (
            <section key={product.id}>
              <div className="mb-3">
                <h2 className="font-semibold">{getProductSectionTitle(product)}</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {product.variants.map((variant) => (
                  <TierCard
                    key={variant.id}
                    product={toTierCardProduct(product)}
                    variant={toTierCardVariant(variant)}
                    isLoggedIn={Boolean(user)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
