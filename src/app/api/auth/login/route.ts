import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashEmailCode, normalizeEmail } from "@/lib/emailVerification";
import { ensureInviteCode, findInviterByCode } from "@/lib/invite";

const schema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  emailCode: z.string().trim().regex(/^\d{6}$/, "请输入 6 位邮箱验证码"),
  name: z.string().trim().min(1, "请输入用户名").max(40, "用户名过长").optional(),
  password: z.string().min(6, "密码至少 6 位").max(72, "密码过长").optional(),
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

  if (!existing && (!parsed.data.name || !parsed.data.password)) {
    return NextResponse.json({ ok: true, needsRegistration: true, email });
  }

  let inviterId: string | null = null;
  const inviteCode = parsed.data.inviteCode?.trim();
  if (!existing && inviteCode) {
    const inviter = await findInviterByCode(inviteCode);
    if (!inviter) {
      return NextResponse.json({ error: "邀请码不存在" }, { status: 400 });
    }
    inviterId = inviter.id;
  }

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
        name: parsed.data.name,
        emailVerifiedAt: new Date(),
        passwordHash: await hashPassword(parsed.data.password!),
        invitedById: inviterId,
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
