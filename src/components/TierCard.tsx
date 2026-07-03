"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import { formatMoney } from "@/lib/money";
import { getProductImage } from "@/lib/productImages";
import { emitClientEvent } from "@/lib/clientEvents";
import { getTierCardUnitLabel, type TierCardProduct, type TierCardVariant } from "@/lib/tierCardData";

type TierCardProps = {
  product: TierCardProduct;
  variant: TierCardVariant;
  isLoggedIn?: boolean;
};

export function TierCard({ product, variant, isLoggedIn = false }: TierCardProps) {
  const imageSrc = getProductImage(product.slug, product.image);
  const unitLabel = getTierCardUnitLabel(product);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isLoggedIn) return;
    event.preventDefault();
    emitClientEvent("openLoginModal");
  }

  return (
    <Link
      onClick={handleClick}
      href={{
        pathname: "/redeem",
        query: {
          productSlug: product.slug,
          product: product.name,
          variant: variant.name,
          variantId: variant.id,
          qty: "1",
        },
      }}
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
            质保
          </span>
        </div>

        <div className="mt-auto pt-3 text-xl font-extrabold text-[var(--accent)]">
          {formatMoney(variant.price, variant.currency)}
          <span className="ml-1 text-sm font-medium text-[var(--muted)]">{unitLabel}</span>
        </div>
      </div>
    </Link>
  );
}
