import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TierCard } from "@/components/TierCard";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        include: { variants: { orderBy: { price: "asc" } } },
      },
    },
  });

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
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
                <h2 className="font-semibold">
                  {product.slug.includes("shared") ? "共享合租" : "个人直充"}
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {product.variants.map((variant) => (
                  <TierCard
                    key={variant.id}
                    product={product}
                    variant={variant}
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
