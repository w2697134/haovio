import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { ensureInviteCode, findInviterByCode, grantWelcomeCoupon } from "@/lib/invite";

const schema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
  name: z.string().trim().max(40).optional(),
  inviteCode: z.string().trim().max(32).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }
  const { email, password, name, inviteCode } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }

  // 解析邀请码(无效邀请码不阻断注册, 仅不建立邀请关系)
  const inviter = inviteCode ? await findInviterByCode(inviteCode) : null;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      name: name || null,
      invitedById: inviter?.id ?? null,
    },
  });

  // 生成本人邀请码; 若来自有效邀请, 发放迎新券
  await ensureInviteCode(user.id);
  if (inviter) {
    await grantWelcomeCoupon(user.id, inviter.id);
  }

  await setSessionCookie(user.id);
  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email },
    invited: Boolean(inviter),
  });
}
