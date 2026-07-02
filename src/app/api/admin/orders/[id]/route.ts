import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_NEXT_STATUS } from "@/lib/orderStatus";
import { grantReferralPointReward } from "@/lib/invite";

const schema = z.object({
  status: z.enum(["PAID", "PROCESSING", "COMPLETED", "CANCELLED"]).optional(),
  totalAmount: z.number().int().min(0, "金额不能小于 0").optional(),
  contactEmail: z.union([z.string().email("联系邮箱格式不正确"), z.null()]).optional(),
  note: z.union([z.string().max(500, "备注最多 500 字"), z.null()]).optional(),
  accountInfo: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, "没有可更新的内容");

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

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

  const data = parsed.data;
  const updateData: {
    status?: string;
    paidAt?: Date | null;
    totalAmount?: number;
    contactEmail?: string | null;
    note?: string | null;
    accountInfo?: string;
  } = {};

  if (data.status) {
    const allowed = ADMIN_NEXT_STATUS[order.status] ?? [];
    if (!allowed.includes(data.status)) {
      return NextResponse.json(
        { error: `不能从 ${order.status} 变更为 ${data.status}` },
        { status: 400 }
      );
    }
    updateData.status = data.status;
    updateData.paidAt = data.status === "PAID" && !order.paidAt ? new Date() : order.paidAt;
  }

  if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
  if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
  if (data.note !== undefined) updateData.note = data.note;

  if (data.accountInfo !== undefined) {
    try {
      const parsedAccountInfo = JSON.parse(data.accountInfo);
      if (!parsedAccountInfo || typeof parsedAccountInfo !== "object" || Array.isArray(parsedAccountInfo)) {
        return NextResponse.json({ error: "账号信息必须是 JSON 对象" }, { status: 400 });
      }
      updateData.accountInfo = JSON.stringify(parsedAccountInfo);
    } catch {
      return NextResponse.json({ error: "账号信息 JSON 格式错误" }, { status: 400 });
    }
  }

  await prisma.order.update({
    where: { id },
    data: updateData,
  });

  // 被邀请人订单完成后，按实付金额给邀请人发余额返利；以订单 id 幂等去重。
  if (
    updateData.status === "COMPLETED" &&
    order.status !== "COMPLETED" &&
    order.userId
  ) {
    const buyer = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { id: true, invitedById: true },
    });
    if (buyer?.invitedById) {
      await grantReferralPointReward({
        inviterId: buyer.invitedById,
        inviteeId: buyer.id,
        amountCents: updateData.totalAmount ?? order.totalAmount,
        refType: "Order",
        refId: order.id,
      });
    }
  }

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
  const order = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

  await prisma.order.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
