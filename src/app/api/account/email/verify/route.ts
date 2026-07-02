import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashEmailCode, normalizeEmail } from "@/lib/emailVerification";

const schema = z.object({
  email: z.string().trim().email("邮箱格式不正确").max(120, "邮箱过长"),
  code: z.string().trim().regex(/^\d{6}$/, "验证码应为6位数字"),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const existing = await prisma.user.findFirst({
    where: { email, id: { not: user.id } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "该邮箱已被其他账号使用" }, { status: 400 });
  }

  const record = await prisma.emailVerificationCode.findFirst({
    where: {
      userId: user.id,
      email,
      purpose: "BIND_EMAIL",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return NextResponse.json({ error: "验证码无效或已过期" }, { status: 400 });
  if (record.attempts >= 5) return NextResponse.json({ error: "验证码错误次数过多，请重新发送" }, { status: 400 });

  const matched = record.codeHash === hashEmailCode(email, parsed.data.code);
  if (!matched) {
    await prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "验证码不正确" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { email, emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, email });
}
