import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateCardCode } from "@/lib/cardRedeem";

const schema = z.object({
  productType: z.string().trim().min(1, "请输入商品类型").max(80, "商品类型过长"),
  batchName: z.string().trim().max(80, "批次名称过长").optional(),
  count: z.number().int().min(1, "至少生成 1 个").max(500, "一次最多生成 500 个"),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }

  const { productType, batchName, count, expiresAt } = parsed.data;
  const codes = new Set<string>();
  while (codes.size < count) codes.add(generateCardCode());

  const rows = [...codes].map((code) => ({
    code,
    productType,
    batchName: batchName || null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  }));

  await prisma.cardCode.createMany({ data: rows });

  return NextResponse.json({ ok: true, codes: rows.map((row) => row.code) });
}
