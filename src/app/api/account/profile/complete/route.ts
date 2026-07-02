import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureInviteCode, findInviterByCode, grantWelcomeCoupon, normalizeInviteCode } from "@/lib/invite";

const schema = z.object({
  name: z.string().trim().min(1, "请填写用户名").max(40, "用户名最多 40 个字"),
  inviteCode: z.string().trim().max(32, "邀请码过长").optional(),
});

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, invitedById: true, inviteCode: true },
  });
  if (!user) {
    return NextResponse.json({ error: "账户不存在，请重新登录" }, { status: 401 });
  }

  const inviteCode = parsed.data.inviteCode?.trim();
  let inviter: { id: string } | null = null;
  let shouldGrantWelcomeCoupon = false;

  if (inviteCode) {
    const ownInviteCode = user.inviteCode ?? (await ensureInviteCode(user.id));
    const isOwnInviteCode = normalizeInviteCode(inviteCode) === normalizeInviteCode(ownInviteCode);
    if (!isOwnInviteCode) {
      inviter = await findInviterByCode(inviteCode, user.id);
      if (!inviter) {
        return NextResponse.json({ error: "邀请码无效" }, { status: 400 });
      }
      if (user.invitedById && user.invitedById !== inviter.id) {
        return NextResponse.json({ error: "邀请码已绑定，不能更换" }, { status: 400 });
      }
      shouldGrantWelcomeCoupon = !user.invitedById;
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      ...(inviter && !user.invitedById ? { invitedById: inviter.id } : {}),
    },
  });

  await ensureInviteCode(user.id);

  if (inviter && shouldGrantWelcomeCoupon) {
    await grantWelcomeCoupon(user.id, inviter.id);
  }

  return NextResponse.json({ ok: true });
}
