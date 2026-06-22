import Link from "next/link";
import { prisma } from "@/lib/db";
import { HomeHero } from "@/components/HomeHero";
import { TierCard } from "@/components/TierCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        take: 8,
        include: { variants: { orderBy: { price: "asc" } } },
      },
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4">
      <HomeHero />

      {categories.map((cat) => (
        <section key={cat.id} className="mb-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-bold">{cat.name}</h2>
            <Link href={`/c/${cat.slug}`} className="text-sm font-medium text-[var(--primary)] hover:underline">
              全部档位 →
            </Link>
          </div>

          <div className="grid gap-8">
            {cat.products.map((product) => (
              <div key={product.id}>
                <div className="mb-3">
                  <h3 className="font-semibold">
                    {product.slug.includes("shared") ? "共享合租" : "个人直充"}
                  </h3>
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
              </div>
            ))}
          </div>
        </section>
      ))}

    </div>
  );
}
