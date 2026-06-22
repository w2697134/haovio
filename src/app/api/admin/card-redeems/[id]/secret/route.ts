import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { decryptSensitiveText } from "@/lib/cardRedeem";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const redeem = await prisma.cardRedeem.findUnique({
    where: { id },
    select: {
      id: true,
      cookieJsonCipher: true,
      cookieHeaderCipher: true,
      cookieClearedAt: true,
    },
  });
  if (!redeem) return NextResponse.json({ error: "兑换记录不存在" }, { status: 404 });
  if (redeem.cookieClearedAt || !redeem.cookieJsonCipher || !redeem.cookieHeaderCipher) {
    return NextResponse.json({ error: "Cookie 原文已清除" }, { status: 410 });
  }

  try {
    return NextResponse.json({
      ok: true,
      cookieJson: decryptSensitiveText(redeem.cookieJsonCipher),
      cookieHeader: decryptSensitiveText(redeem.cookieHeaderCipher),
    });
  } catch {
    return NextResponse.json({ error: "Cookie 解密失败" }, { status: 500 });
  }
}
