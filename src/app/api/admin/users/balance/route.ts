import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MAX_ADJUST_CENTS = 100_000_000;

const schema = z.object({
  target: z.string().trim().min(1, "请输入用户ID或邮箱"),
  amount: z.string().trim().min(1, "请输入金额"),
  note: z.string().trim().max(200, "备注最多 200 字").optional(),
});

function parseSignedCents(value: string) {
  if (!/^-?\d+(\.\d{0,2})?$/.test(value)) return null;
  const sign = value.startsWith("-") ? -1 : 1;
  const normalized = value.replace(/^-/, "");
  const [yuan, cent = ""] = normalized.split(".");
  const cents = Number(yuan) * 100 + Number(cent.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) return null;
  return sign * cents;
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const { target, note } = parsed.data;
  const amount = parseSignedCents(parsed.data.amount);
  if (!amount || Math.abs(amount) > MAX_ADJUST_CENTS) {
    return NextResponse.json({ error: "金额不正确" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: target.includes("@") ? { email: target } : { id: target },
    select: { id: true, email: true, pointsBalance: true },
  });
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  if (user.pointsBalance + amount < 0) {
    return NextResponse.json({ error: "扣减后余额不能为负数" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { pointsBalance: { increment: amount } },
      select: { id: true, email: true, pointsBalance: true },
    });

    await tx.pointLedger.create({
      data: {
        userId: user.id,
        type: "ADMIN_ADJUST",
        amount,
        balanceAfter: updatedUser.pointsBalance,
        note: note || "Admin balance adjust",
        refType: "ADMIN",
        refId: user.id,
      },
    });

    return updatedUser;
  });

  return NextResponse.json({ ok: true, user: updated });
}
