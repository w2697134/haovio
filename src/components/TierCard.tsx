import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { getProductImage } from "@/lib/productImages";

export type TierCardProduct = {
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
};

export type TierCardVariant = {
  id: string;
  name: string;
  price: number;
  currency: string;
};

type TierCardProps = {
  product: TierCardProduct;
  variant: TierCardVariant;
  note?: string;
};

export function TierCard({ product, variant, note }: TierCardProps) {
  const imageSrc = getProductImage(product.slug, product.image);

  return (
    <Link
      href={`/p/${product.slug}?v=${variant.id}`}
      className="card group flex min-h-[7.5rem] overflow-hidden transition hover:border-[var(--primary)]"
    >
      <div className="relative w-[6.5rem] shrink-0 overflow-hidden border-r border-[var(--border)] bg-white sm:w-[7.5rem]">
        {imageSrc ? (
          <div className="absolute inset-0 p-5">
            <Image
              src={imageSrc}
              alt={`${product.name} ${variant.name}`}
              fill
              sizes="120px"
              className="object-contain transition duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <span className="grid h-full place-items-center text-3xl">GPT</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-[var(--muted)]">{product.name}</div>
            <h3 className="mt-0.5 text-lg font-bold leading-tight">{variant.name}</h3>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.14)]" />
            质保
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
          {note ?? product.description}
        </p>

        <div className="mt-auto pt-3 text-xl font-extrabold text-[var(--accent)]">
          {formatMoney(variant.price, variant.currency)}
          <span className="ml-1 text-sm font-medium text-[var(--muted)]">/月</span>
        </div>
      </div>
    </Link>
  );
}
