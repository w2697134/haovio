"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type AccountField } from "./CartProvider";
import { formatMoney } from "@/lib/money";

export type DetailVariant = {
  id: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
};

export type DetailProduct = {
  slug: string;
  name: string;
  description: string | null;
  region: string;
  deliveryType: string;
  image: string | null;
  accountFields: AccountField[];
  variants: DetailVariant[];
};

// 商品名里的括号部分(如"（3-4人共用）")拆到下一行显示
function splitName(name: string): { main: string; sub: string | null } {
  const m = name.match(/^(.*?)[（(](.+?)[)）]\s*$/);
  if (m && m[1].trim()) return { main: m[1].trim(), sub: `（${m[2]}）` };
  return { main: name, sub: null };
}

export function ProductDetail({
  product,
  initialVariantId,
}: {
  product: DetailProduct;
  initialVariantId?: string;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const selectedVariantId = product.variants.some((v) => v.id === initialVariantId)
    ? initialVariantId!
    : product.variants[0]?.id ?? "";
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const auto = product.deliveryType === "AUTO";

  function buildItem() {
    return {
      productSlug: product.slug,
      productName: product.name,
      variantId: variant.id,
      variantName: variant.name,
      unitPrice: variant.price,
      currency: variant.currency,
      image: product.image,
      deliveryType: product.deliveryType,
      accountFields: product.accountFields.filter((field) => !["password", "note"].includes(field.key)),
    };
  }

  function addToCart() {
    if (!variant) return;
    addItem(buildItem(), qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function buyNow() {
    if (!variant) return;
    const params = new URLSearchParams({
      product: product.name,
      variant: variant.name,
      qty: String(qty),
    });
    router.push("/redeem?" + params.toString());
  }

  return (
    <div data-product-detail className="grid items-stretch gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
      <div data-product-image className={`card relative aspect-square w-full overflow-hidden shadow-sm ${product.image ? "!bg-white" : "bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)]"}`}>
        {product.image ? (
          <div className="absolute inset-0 p-12">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="grid h-full place-items-center text-7xl">{auto ? "🎁" : "📺"}</div>
        )}
      </div>

      <div data-purchase-panel className="card flex flex-col p-6 shadow-sm lg:min-h-[420px] lg:p-8">
        <h1 className="text-2xl font-bold">
          {splitName(product.name).main}
          {splitName(product.name).sub && (
            <span className="block text-lg font-semibold text-[var(--muted)]">
              {splitName(product.name).sub}
            </span>
          )}
        </h1>
        {product.description && (
          <p className="mt-2 text-sm text-[var(--muted)]">{product.description}</p>
        )}

        <div className="mt-6">
          <div className="mb-2 text-sm text-[var(--muted)]">当前套餐</div>
          <div className="inline-flex min-w-[220px] items-center justify-between gap-8 rounded-xl border border-[var(--primary)] bg-[var(--primary)]/10 px-5 py-4">
            <div className="font-semibold">{variant?.name ?? "暂无套餐"}</div>
            <div className="font-bold text-[var(--accent)]">
              {variant ? formatMoney(variant.price, variant.currency) : "-"}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span className="text-sm text-[var(--muted)]">数量</span>
          <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5">
              −
            </button>
            <span className="w-10 text-center">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="px-3 py-1.5">
              +
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-baseline gap-2">
          <span className="text-sm text-[var(--muted)]">合计</span>
          <span className="text-3xl font-extrabold text-[var(--accent)]">
            {variant ? formatMoney(variant.price * qty, variant.currency) : "-"}
          </span>
        </div>

        <div data-purchase-actions className="mt-8 flex gap-3 lg:mt-auto">
          <button onClick={addToCart} className="flex-1 rounded-xl border border-[var(--border)] py-3 font-semibold hover:bg-[var(--surface-2)]">
            {added ? "✓ 已加入" : "加入购物车"}
          </button>
          <button onClick={buyNow} className="btn-primary flex-1 py-3">
            立即购买
          </button>
        </div>
      </div>
    </div>
  );
}
