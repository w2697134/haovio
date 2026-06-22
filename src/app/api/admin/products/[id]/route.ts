import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/productSchema";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const slugOwner = await prisma.product.findUnique({ where: { slug: d.slug } });
  if (slugOwner && slugOwner.id !== id) {
    return NextResponse.json({ error: "slug 已被其他商品占用" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.productVariant.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        slug: d.slug,
        name: d.name,
        description: d.description,
        region: d.region,
        deliveryType: d.deliveryType,
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
    }),
  ]);

  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({ status: z.enum(["ACTIVE", "HIDDEN"]) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "参数错误" }, { status: 400 });

  await prisma.product.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
