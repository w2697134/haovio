import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductListRow, type AdminProduct } from "@/components/admin/ProductListRow";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    include: { category: true, variants: { orderBy: { price: "asc" } } },
  });

  const data: AdminProduct[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    status: p.status,
    deliveryType: p.deliveryType,
    categoryName: p.category.name,
    minPrice: p.variants[0]?.price ?? 0,
    currency: p.variants[0]?.currency ?? "CNY",
    variantCount: p.variants.length,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">商品管理 · 共 {data.length} 件</h2>
        <Link href="/admin/products/new" className="btn-primary px-4 py-2 text-sm">
          + 新增商品
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-[var(--border)] text-xs text-[var(--muted)]">
            <tr>
              <th className="p-3 font-medium">商品</th>
              <th className="p-3 font-medium">分类</th>
              <th className="p-3 font-medium">发货</th>
              <th className="p-3 font-medium">价格</th>
              <th className="p-3 font-medium">状态</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <ProductListRow key={p.id} product={p} />
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="p-10 text-center text-[var(--muted)]">暂无商品</p>}
      </div>
    </div>
  );
}
