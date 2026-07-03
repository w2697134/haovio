import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/emailVerification";

const schema = z.object({
  email: z.string().trim().email("邮箱格式不正确").max(120, "邮箱过长"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  return NextResponse.json({
    ok: true,
    exists: Boolean(user),
    hasPassword: Boolean(user && !user.passwordHash.startsWith("NO_PASSWORD:")),
  });
}
