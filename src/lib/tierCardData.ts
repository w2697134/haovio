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

export function toTierCardProduct(product: TierCardProduct): TierCardProduct {
  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    image: product.image,
  };
}

export function toTierCardVariant(variant: TierCardVariant): TierCardVariant {
  return {
    id: variant.id,
    name: variant.name,
    price: variant.price,
    currency: variant.currency,
  };
}

export function getProductSectionTitle(product: Pick<TierCardProduct, "slug" | "name">) {
  if (product.slug.includes("shared")) return "共享合租";
  if (product.slug.includes("sms")) return "海外手机号";
  if (product.slug.includes("chatgpt")) return "个人直充";
  return product.name;
}

export function getTierCardUnitLabel(product: Pick<TierCardProduct, "slug">) {
  if (product.slug.includes("sms")) return "/次";
  return "/月";
}

export function allowsSessionDeliveryForProduct(product: Pick<TierCardProduct, "slug">) {
  return product.slug === "chatgpt-direct";
}
