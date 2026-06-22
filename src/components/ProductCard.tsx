import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/money";
import { getProductImage } from "@/lib/productImages";

type Variant = { price: number; currency: string };

export type ProductCardData = {
  slug: string;
  name: string;
  region: string;
  deliveryType: string;
  image?: string | null;
  description?: string | null;
  variants: Variant[];
};

// 商品名里的括号部分(如"（3-4人共用）")拆到下一行显示
function splitName(name: string): { main: string; sub: string | null } {
  const m = name.match(/^(.*?)[（(](.+?)[)）]\s*$/);
  if (m && m[1].trim()) return { main: m[1].trim(), sub: `（${m[2]}）` };
  return { main: name, sub: null };
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const prices = product.variants.map((v) => v.price);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const currency = product.variants[0]?.currency ?? "CNY";
  const auto = product.deliveryType === "AUTO";
  const imageSrc = getProductImage(product.slug, product.image);
  const name = splitName(product.name);

  return (
    <Link
      href={`/p/${product.slug}`}
      className="card group flex flex-col overflow-hidden transition hover:border-[var(--primary)]"
    >
      <div className={`relative h-36 overflow-hidden border-b border-[var(--border)] ${imageSrc ? "bg-white" : "bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)]"}`}>
        {imageSrc ? (
          <div className="absolute inset-0 p-8">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain transition duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <span className="grid h-full place-items-center text-4xl opacity-80 transition group-hover:scale-110">
            {auto ? "🎁" : "📺"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="min-h-12 font-semibold">
          {name.main}
          {name.sub && (
            <span className="block text-sm font-normal text-[var(--muted)]">
              {name.sub}
            </span>
          )}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{product.description}</p>
        )}
        <div className="mt-auto pt-3">
          <span className="text-sm text-[var(--muted)]">起价 </span>
          <span className="text-lg font-bold text-[var(--accent)]">
            {formatMoney(min, currency)}
          </span>
          {max > min && (
            <span className="text-xs text-[var(--muted)]"> ~ {formatMoney(max, currency)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
