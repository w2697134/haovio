import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  emailCodeExpiresAt,
  generateEmailCode,
  hashEmailCode,
  normalizeEmail,
  sendVerificationEmail,
} from "@/lib/emailVerification";

const SEND_COOLDOWN_MS = 60 * 1000;
const HOURLY_LIMIT = 5;

const schema = z.object({
  email: z.string().trim().email("邮箱格式不正确").max(120, "邮箱过长"),
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

  const now = Date.now();
  const oneMinuteAgo = new Date(now - SEND_COOLDOWN_MS);
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const [recent, hourCount] = await Promise.all([
    prisma.emailVerificationCode.findFirst({
      where: { userId: user.id, purpose: "BIND_EMAIL", createdAt: { gte: oneMinuteAgo } },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.emailVerificationCode.count({
      where: { userId: user.id, purpose: "BIND_EMAIL", createdAt: { gte: oneHourAgo } },
    }),
  ]);

  if (recent) {
    const retryAfter = Math.max(1, Math.ceil((recent.createdAt.getTime() + SEND_COOLDOWN_MS - now) / 1000));
    return NextResponse.json({ error: `发送太频繁，请 ${retryAfter} 秒后再试`, retryAfter }, { status: 429 });
  }

  if (hourCount >= HOURLY_LIMIT) {
    return NextResponse.json({ error: "发送次数过多，请一小时后再试", retryAfter: 60 * 60 }, { status: 429 });
  }

  const code = generateEmailCode();
  const verification = await prisma.emailVerificationCode.create({
    data: {
      userId: user.id,
      email,
      purpose: "BIND_EMAIL",
      codeHash: hashEmailCode(email, code),
      expiresAt: emailCodeExpiresAt(),
    },
  });

  try {
    await sendVerificationEmail({ to: email, code });
  } catch (error) {
    await prisma.emailVerificationCode.delete({ where: { id: verification.id } }).catch(() => null);
    return NextResponse.json(
      { error: error instanceof Error && error.message === "RESEND_NOT_CONFIGURED" ? "邮件服务未配置" : "邮件发送失败" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
