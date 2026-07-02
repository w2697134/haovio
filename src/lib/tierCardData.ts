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
