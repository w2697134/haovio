import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "该入口已停用" }, { status: 410 });
}
