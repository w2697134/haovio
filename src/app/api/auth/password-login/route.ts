import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/emailVerification";

const schema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  password: z.string().min(1, "请输入密码").max(72, "密码过长"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.passwordHash.startsWith("NO_PASSWORD:")) {
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 400 });
  }

  const matched = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!matched) {
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 400 });
  }

  await setSessionCookie(user.id);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
    needsProfile: !user.name?.trim(),
  });
}
