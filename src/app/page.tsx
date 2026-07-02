import { prisma } from "@/lib/db";
import { HomeHero } from "@/components/HomeHero";
import { TierCard } from "@/components/TierCard";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { toTierCardProduct, toTierCardVariant } from "@/lib/tierCardData";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, settings, user] = await Promise.all([
    prisma.category.findMany({
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
    }),
    getSettings(),
    getCurrentUser(),
  ]);
  const qqGroup = settings.contacts.find((contact) => contact.platform === "QQ群")?.account;

  return (
    <div className="mx-auto max-w-6xl px-4">
      <HomeHero qqGroup={qqGroup} />

      {categories.map((cat) => (
        <section key={cat.id} className="mb-14">
          <div className="mb-7 flex items-end justify-between gap-4">
            <h2 className="relative text-3xl font-black tracking-tight sm:text-4xl">
              <span
                aria-hidden="true"
                className="absolute left-[-14px] top-1/2 h-[0.78em] w-1.5 -translate-y-1/2 rounded-full bg-[var(--primary)]"
              />
              {cat.name}
            </h2>
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
                      product={toTierCardProduct(product)}
                      variant={toTierCardVariant(variant)}
                      isLoggedIn={Boolean(user)}
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
