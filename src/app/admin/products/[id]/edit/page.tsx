import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm, type ProductFormInitial } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  let accountFields: { key: string; label: string; required: boolean; placeholder?: string }[] = [];
  try {
    accountFields = JSON.parse(product.accountFields);
  } catch {}

  const initial: ProductFormInitial = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? "",
    region: product.region,
    status: product.status,
    categoryId: product.categoryId,
    accountFields: accountFields.map((a) => ({
      key: a.key,
      label: a.label,
      required: a.required,
      placeholder: a.placeholder ?? "",
    })),
    variants: product.variants.map((v) => ({
      name: v.name,
      price: (v.price / 100).toString(),
      cost: (v.cost / 100).toString(),
      currency: v.currency,
      stock: v.stock.toString(),
    })),
  };

  return (
    <div>
      <h2 className="mb-4 font-bold">编辑商品 · {product.name}</h2>
      <ProductForm categories={categories} initial={initial} />
    </div>
  );
}
