import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h2 className="mb-4 font-bold">新增商品</h2>
      <ProductForm categories={categories} />
    </div>
  );
}
