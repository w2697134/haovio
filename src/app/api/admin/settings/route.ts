import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  contacts: z
    .array(
      z.object({
        platform: z.string().min(1),
        account: z.string().min(1),
        qrUrl: z.string().optional().nullable(),
      })
    )
    .default([]),
  qrUrl: z.string().optional().nullable(),
  instruction: z.string().max(500).default(""),
});

export async function PUT(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  await prisma.setting.upsert({
    where: { id: 1 },
    update: {
      contacts: JSON.stringify(d.contacts),
      qrUrl: d.qrUrl || null,
      instruction: d.instruction,
    },
    create: {
      id: 1,
      contacts: JSON.stringify(d.contacts),
      qrUrl: d.qrUrl || null,
      instruction: d.instruction,
    },
  });

  return NextResponse.json({ ok: true });
}
