import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "该入口已停用，请使用在线充值" }, { status: 410 });
}
