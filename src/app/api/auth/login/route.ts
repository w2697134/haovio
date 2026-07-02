import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashEmailCode, normalizeEmail } from "@/lib/emailVerification";
import { ensureInviteCode } from "@/lib/invite";

const schema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  emailCode: z.string().trim().regex(/^\d{6}$/, "请输入 6 位邮箱验证码"),
  inviteCode: z.string().trim().max(32).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const record = await prisma.emailVerificationCode.findFirst({
    where: {
      email,
      purpose: "AUTH",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return NextResponse.json({ error: "请先获取邮箱验证码" }, { status: 400 });
  }
  if (record.attempts >= 5) {
    return NextResponse.json({ error: "验证码错误次数过多，请重新发送" }, { status: 400 });
  }

  const matched = record.codeHash === hashEmailCode(email, parsed.data.emailCode);
  if (!matched) {
    await prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "验证码不正确" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  const user = await prisma.$transaction(async (tx) => {
    if (existing) {
      const updated = !existing.emailVerifiedAt
        ? await tx.user.update({
            where: { id: existing.id },
            data: { emailVerifiedAt: new Date() },
          })
        : existing;

      await tx.emailVerificationCode.update({
        where: { id: record.id },
        data: { consumedAt: new Date(), userId: existing.id },
      });

      return updated;
    }

    const created = await tx.user.create({
      data: {
        email,
        emailVerifiedAt: new Date(),
        passwordHash: `NO_PASSWORD:${crypto.randomUUID()}`,
      },
    });

    await tx.emailVerificationCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date(), userId: created.id },
    });

    return created;
  });

  await ensureInviteCode(user.id);
  await setSessionCookie(user.id);

  const needsProfile = !user.name?.trim();

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
    registered: !existing,
    needsProfile,
  });
}
