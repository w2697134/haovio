import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

const schema = z.object({
  accessKey: z.string().min(1, "请输入管理员密钥"),
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

  const adminAccessKey = process.env.ADMIN_ACCESS_KEY;
  if (!adminAccessKey) {
    return NextResponse.json({ error: "管理员密钥未配置" }, { status: 500 });
  }

  if (parsed.data.accessKey !== adminAccessKey) {
    return NextResponse.json({ error: "管理员密钥错误" }, { status: 401 });
  }

  const user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!user) {
    return NextResponse.json({ error: "管理员账号未初始化" }, { status: 500 });
  }

  await setSessionCookie(user.id);
  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, role: user.role },
  });
}
