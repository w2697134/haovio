import { z } from "zod";

const variantSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().min(0),
  cost: z.number().int().min(0).default(0),
  currency: z.string().default("CNY"),
  stock: z.number().int().default(-1),
});

const accountFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean().default(true),
  placeholder: z.string().optional(),
});

export const productSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug 仅允许小写字母/数字/短横线"),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  region: z.string().default("Global"),
  deliveryType: z.literal("MANUAL").default("MANUAL"),
  status: z.enum(["ACTIVE", "HIDDEN"]).default("ACTIVE"),
  categoryId: z.string().min(1),
  accountFields: z.array(accountFieldSchema).default([]),
  variants: z.array(variantSchema).min(1, "至少一个规格"),
});

export type ProductInput = z.infer<typeof productSchema>;
