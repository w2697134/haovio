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
};

export function TierCard({ product, variant }: TierCardProps) {
  const imageSrc = getProductImage(product.slug, product.image);

  return (
    <Link
      href={`/p/${product.slug}?v=${variant.id}`}
      className="card group flex min-h-[7.5rem] overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[0_18px_45px_rgba(79,70,229,0.12)]"
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
            <h3 className="text-xl font-extrabold leading-tight">{variant.name}</h3>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="none"
            >
              <path
                d="M8 1.8 3.2 3.6v3.6c0 3 1.9 5.7 4.8 7 2.9-1.3 4.8-4 4.8-7V3.6L8 1.8Z"
                fill="currentColor"
                opacity="0.16"
              />
              <path
                d="m5.6 8 1.5 1.5 3.3-3.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            质保
          </span>
        </div>

        <div className="mt-auto pt-3 text-xl font-extrabold text-[var(--accent)]">
          {formatMoney(variant.price, variant.currency)}
          <span className="ml-1 text-sm font-medium text-[var(--muted)]">/月</span>
        </div>
      </div>
    </Link>
  );
}
