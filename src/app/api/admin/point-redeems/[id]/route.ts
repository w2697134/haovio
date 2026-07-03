import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { decryptSensitiveText, validateChatGptCookieJson } from "@/lib/cookieTools";
import { prisma } from "@/lib/db";
import { POINT_REDEEM_STATUSES, type PointRedeemStatus } from "@/lib/points";

const schema = z
  .object({
    action: z.enum(["refund"]).optional(),
    status: z.enum(POINT_REDEEM_STATUSES).optional(),
    adminNote: z.union([z.string().max(1000, "备注最多 1000 字"), z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "没有可更新的内容");

async function refundPointRedeem(id: string) {
  return prisma.$transaction(async (tx) => {
    const redeem = await tx.pointRedeem.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, pointsCost: true, processedAt: true },
    });
    if (!redeem) return { error: "订单不存在", status: 404 };
    if (redeem.status === "VOID") return { error: "订单已作废，不能重复退回", status: 400 };

    const existingRefund = await tx.pointLedger.findFirst({
      where: { type: "REFUND", refType: "POINT_REDEEM", refId: redeem.id },
      select: { id: true },
    });
    if (existingRefund) return { error: "该订单已有退回流水，不能重复退回", status: 400 };

    const now = new Date();
    const updatedUser = await tx.user.update({
      where: { id: redeem.userId },
      data: { pointsBalance: { increment: redeem.pointsCost } },
      select: { pointsBalance: true },
    });

    await tx.pointRedeem.update({
      where: { id: redeem.id },
      data: {
        status: "VOID",
        processedAt: redeem.processedAt ?? now,
      },
    });

    await tx.pointLedger.create({
      data: {
        userId: redeem.userId,
        type: "REFUND",
        amount: redeem.pointsCost,
        balanceAfter: updatedUser.pointsBalance,
        note: "Admin refund point redeem",
        refType: "POINT_REDEEM",
        refId: redeem.id,
      },
    });

    return { ok: true, balance: updatedUser.pointsBalance };
  });
}

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

  const data = parsed.data;

  if (data.action === "refund") {
    try {
      const result = await refundPointRedeem(id);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: "退回失败" }, { status: 500 });
    }
  }

  const redeem = await prisma.pointRedeem.findUnique({ where: { id } });
  if (!redeem) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  if (redeem.status === "VOID" && data.status) {
    return NextResponse.json({ error: "退回订单已锁定，不能修改状态" }, { status: 400 });
  }

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
      cookieHeaderCipher: true,
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
    const sessionJson = decryptSensitiveText(redeem.cookieJsonCipher);
    const normalized = validateChatGptCookieJson(sessionJson);
    return NextResponse.json({
      ok: true,
      id: redeem.id,
      sessionJson,
      cookieJson: normalized.normalizedJson ?? null,
      cookieHeader: redeem.cookieHeaderCipher ? decryptSensitiveText(redeem.cookieHeaderCipher) : normalized.header ?? null,
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
