import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { buildSystemPrompt } from "@/lib/kb";

// —— 简单的内存防刷:每 IP 在窗口内限若干次(单进程部署足够)——
const WINDOW_MS = 30_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t > WINDOW_MS)) hits.delete(k);
  }
  return false;
}

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(1000),
      })
    )
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ fallback: true, error: "参数错误" }, { status: 200 });
  }

  const lastUser = [...parsed.data.messages].reverse().find((m) => m.role === "user");
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ fallback: true, error: "AI 未配置" }, { status: 200 });
  }

  // 防刷:发太快直接温和打回,不消耗模型额度
  if (isRateLimited(getIp(req))) {
    return NextResponse.json({
      reply: "你发得有点快啦 😅 歇几秒再问我哈~ 急的话直接加 QQ 找客服。",
    });
  }

  const settings = await getSettings();
  const system = buildSystemPrompt(settings.contacts);

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "flash";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...parsed.data.messages],
        temperature: 0.3,
        max_tokens: 220,
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ fallback: true, error: `上游 ${res.status}` }, { status: 200 });
    }

    const data = await res.json();
    const reply: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ fallback: true, error: "空回复" }, { status: 200 });
    }

    // 模型判定为知识库未覆盖 → 记录问题,引导加 QQ,不瞎答
    const norm = reply.toUpperCase().replace(/[^A-Z]/g, "");
    if (norm === "UNKNOWN") {
      if (lastUser) {
        prisma.unknownQuestion
          .create({ data: { question: lastUser.content.slice(0, 500) } })
          .catch(() => {});
      }
      return NextResponse.json({
        reply: "这个问题我这边不太确定,怕答错误导你 😅 直接加 QQ 问下真人客服,会给你准话~",
        unknown: true,
      });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ fallback: true, error: "网络错误" }, { status: 200 });
  }
}
