import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { decryptSensitiveText } from "@/lib/cookieTools";
import { prisma } from "@/lib/db";
import { POINT_REDEEM_STATUSES, type PointRedeemStatus } from "@/lib/points";

const schema = z
  .object({
    status: z.enum(POINT_REDEEM_STATUSES).optional(),
    adminNote: z.union([z.string().max(1000, "备注最多 1000 字"), z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "没有可更新的内容");

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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const redeem = await prisma.pointRedeem.findUnique({ where: { id } });
  if (!redeem) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

  const data = parsed.data;
  const now = new Date();
  const updateData: {
    status?: PointRedeemStatus;
    adminNote?: string | null;
    processedAt?: Date;
    completedAt?: Date;
  } = {};

  if (data.status) {
    updateData.status = data.status;
    if (data.status === "PROCESSING" && !redeem.processedAt) updateData.processedAt = now;
    if (data.status === "COMPLETED") updateData.completedAt = now;
  }
  if (data.adminNote !== undefined) updateData.adminNote = data.adminNote;

  await prisma.pointRedeem.update({ where: { id }, data: updateData });

  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const redeem = await prisma.pointRedeem.findUnique({
    where: { id },
    select: {
      id: true,
      deliveryMode: true,
      accountInfo: true,
      cookieJsonCipher: true,
      cookieMeta: true,
    },
  });
  if (!redeem) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  if (redeem.deliveryMode !== "COOKIE") {
    return NextResponse.json({ error: "该订单为人工交付，无 Session" }, { status: 400 });
  }
  if (!redeem.cookieJsonCipher) {
    return NextResponse.json({ error: "该订单没有保存 Session" }, { status: 404 });
  }

  try {
    return NextResponse.json({
      ok: true,
      id: redeem.id,
      sessionJson: decryptSensitiveText(redeem.cookieJsonCipher),
      accountInfo: JSON.parse(redeem.accountInfo || "{}"),
      cookieMeta: JSON.parse(redeem.cookieMeta || "{}"),
    });
  } catch {
    return NextResponse.json({ error: "Session 解密失败" }, { status: 500 });
  }
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
  const redeem = await prisma.pointRedeem.findUnique({ where: { id }, select: { id: true } });
  if (!redeem) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

  await prisma.pointRedeem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
