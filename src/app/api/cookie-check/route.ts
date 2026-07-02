import { NextResponse } from "next/server";
import { z } from "zod";
import { validateChatGptCookieJson } from "@/lib/cookieTools";

const schema = z.object({
  cookieJson: z.string().trim().min(2, "请粘贴 Cookie"),
});

type ChatGptSession = {
  user?: {
    email?: unknown;
    name?: unknown;
    id?: unknown;
  };
};

type CookieInputItem = {
  name?: unknown;
};

type SessionInput = {
  sessionToken?: unknown;
  user?: {
    email?: unknown;
    name?: unknown;
    id?: unknown;
  };
};

function readSessionAccount(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { email: null, name: null, id: null };
    }
    const session = parsed as SessionInput;
    return {
      email: typeof session.user?.email === "string" ? session.user.email : null,
      name: typeof session.user?.name === "string" ? session.user.name : null,
      id: typeof session.user?.id === "string" ? session.user.id : null,
    };
  } catch {
    return { email: null, name: null, id: null };
  }
}

function readCookieNames(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof (parsed as SessionInput).sessionToken === "string"
      ) {
        return ["__Secure-next-auth.session-token"];
      }
      return [];
    }
    return parsed
      .map((item) => (item && typeof item === "object" ? (item as CookieInputItem).name : null))
      .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
      .map((name) => name.trim());
  } catch {
    return [];
  }
}

function hasChatGptSessionCookie(names: string[]) {
  return names.some(
    (name) =>
      name === "__Secure-next-auth.session-token" ||
      name.startsWith("__Secure-next-auth.session-token.") ||
      name === "next-auth.session-token" ||
      name.startsWith("next-auth.session-token.")
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const cookieCheck = validateChatGptCookieJson(parsed.data.cookieJson);
  if (!cookieCheck.ok || !cookieCheck.header) {
    return NextResponse.json({ error: cookieCheck.error ?? "Cookie 格式不正确" }, { status: 400 });
  }

  const cookieNames = readCookieNames(parsed.data.cookieJson);
  const localAccount = readSessionAccount(parsed.data.cookieJson);
  if (!hasChatGptSessionCookie(cookieNames)) {
    return NextResponse.json(
      { error: "缺少登录 Cookie，请确认已导出 ChatGPT 登录后的全部 Cookie" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch("https://chatgpt.com/api/auth/session", {
      method: "GET",
      headers: {
        accept: "application/json",
        cookie: cookieCheck.header,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Cookie 无效或已过期，未读取到账号" }, { status: 400 });
    }

    const data = (await res.json().catch(() => null)) as ChatGptSession | null;
    const email = typeof data?.user?.email === "string" ? data.user.email : "";
    const name = typeof data?.user?.name === "string" ? data.user.name : "";
    const id = typeof data?.user?.id === "string" ? data.user.id : "";

    if (!email && !name && !id) {
      return NextResponse.json({ error: "Cookie 无效或已过期，未读取到账号" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      account: {
        email: email || null,
        name: name || null,
        id: id || null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "已收到账号信息，但在线验证超时"
        : "已收到账号信息，但暂时无法在线验证";
    return NextResponse.json({
      ok: true,
      verified: false,
      warning: message,
      account: localAccount,
    });
  } finally {
    clearTimeout(timeout);
  }
}
