export type SeedAccountField = {
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
};

export type SeedVariant = {
  name: string;
  price: number;
  cost?: number;
  currency?: string;
  stock?: number;
};

export type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  region: string;
  deliveryType: "AUTO" | "MANUAL";
  currency: string;
  image?: string;
  accountFields: SeedAccountField[];
  variants: SeedVariant[];
};

export type SeedCategory = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  products: SeedProduct[];
};
