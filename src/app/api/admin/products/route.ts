import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/productSchema";

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const exists = await prisma.product.findUnique({ where: { slug: d.slug } });
  if (exists) return NextResponse.json({ error: "slug 已存在" }, { status: 409 });

  const product = await prisma.product.create({
    data: {
      slug: d.slug,
      name: d.name,
      description: d.description,
      region: d.region,
      deliveryType: "MANUAL",
      status: d.status,
      categoryId: d.categoryId,
      accountFields: JSON.stringify(d.accountFields),
      variants: {
        create: d.variants.map((v, i) => ({
          name: v.name,
          price: v.price,
          cost: v.cost,
          currency: v.currency,
          stock: v.stock,
          sortOrder: i,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: product.id });
}
