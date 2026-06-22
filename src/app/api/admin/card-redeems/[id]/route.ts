import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  CARD_REDEEM_STATUSES,
  RENEWAL_STATUSES,
  cardStatusForRedeemStatus,
  defaultClearAfterDate,
  type CardRedeemStatus,
} from "@/lib/cardRedeem";

const schema = z
  .object({
    status: z.enum(CARD_REDEEM_STATUSES).optional(),
    renewalStatus: z.enum(RENEWAL_STATUSES).optional(),
    adminNote: z.union([z.string().max(1000, "备注最多 1000 字"), z.null()]).optional(),
    clearCookie: z.boolean().optional(),
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }

  const redeem = await prisma.cardRedeem.findUnique({
    where: { id },
    include: { card: { select: { id: true } } },
  });
  if (!redeem) return NextResponse.json({ error: "兑换记录不存在" }, { status: 404 });

  const data = parsed.data;
  const now = new Date();
  const updateData: {
    status?: CardRedeemStatus;
    renewalStatus?: string;
    adminNote?: string | null;
    processedAt?: Date;
    completedAt?: Date;
    clearAfterAt?: Date;
    cookieJsonCipher?: string;
    cookieHeaderCipher?: string;
    cookieClearedAt?: Date;
  } = {};

  if (data.status) {
    updateData.status = data.status;
    if (data.status === "PROCESSING" && !redeem.processedAt) updateData.processedAt = now;
    if (data.status === "RECHARGED_PENDING_CANCEL") {
      updateData.renewalStatus = "PENDING_CANCEL";
      if (!redeem.processedAt) updateData.processedAt = now;
    }
    if (data.status === "COMPLETED") {
      updateData.renewalStatus = data.renewalStatus ?? "CANCELLED";
      updateData.completedAt = now;
      updateData.clearAfterAt = redeem.clearAfterAt ?? defaultClearAfterDate(now);
    }
  }
  if (data.renewalStatus) updateData.renewalStatus = data.renewalStatus;
  if (data.adminNote !== undefined) updateData.adminNote = data.adminNote;
  if (data.clearCookie) {
    updateData.cookieJsonCipher = "";
    updateData.cookieHeaderCipher = "";
    updateData.cookieClearedAt = now;
  }

  await prisma.$transaction(async (tx) => {
    await tx.cardRedeem.update({ where: { id }, data: updateData });
    if (data.status) {
      await tx.cardCode.update({
        where: { id: redeem.card.id },
        data: { status: cardStatusForRedeemStatus(data.status) },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
