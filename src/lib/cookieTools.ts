import crypto from "crypto";

export type CookieMeta = {
  count: number;
  domains: string[];
  totalValueChars: number;
  formatStatus: "VALID_FORMAT" | "SUSPICIOUS" | "INVALID";
  issues: string[];
  deliveryMode?: "COOKIE" | "MANUAL";
};

type EditCookieItem = {
  name?: unknown;
  value?: unknown;
  domain?: unknown;
  path?: unknown;
};

type ChatGptSessionPayload = {
  sessionToken?: unknown;
};

const ALLOWED_DOMAINS = new Set(["chatgpt.com", ".chatgpt.com"]);
const MAX_COOKIE_COUNT = 100;
const MAX_COOKIE_JSON_CHARS = 80_000;
const SESSION_COOKIE_CHUNK_SIZE = 3800;

function encryptionKey() {
  const secret =
    process.env.COOKIE_ENCRYPTION_KEY ??
    process.env.JWT_SECRET ??
    "dev-cookie-secret-change-me";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSensitiveText(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptSensitiveText(cipherText: string): string {
  const [version, ivText, tagText, encryptedText] = cipherText.split(":");
  if (version !== "v1" || !ivText || !tagText || !encryptedText) {
    throw new Error("UNSUPPORTED_CIPHER_TEXT");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivText, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase();
}

function isAllowedDomain(domain: string) {
  return ALLOWED_DOMAINS.has(normalizeDomain(domain));
}

function isCookieName(name: string) {
  return /^[^()<>@,;:\\\"/\[\]?={}\s]+$/.test(name);
}

function buildSessionTokenCookies(sessionToken: string) {
  const chunks: string[] = [];
  for (let i = 0; i < sessionToken.length; i += SESSION_COOKIE_CHUNK_SIZE) {
    chunks.push(sessionToken.slice(i, i + SESSION_COOKIE_CHUNK_SIZE));
  }

  return chunks.map((value, index) => ({
    name:
      chunks.length === 1
        ? "__Secure-next-auth.session-token"
        : `__Secure-next-auth.session-token.${index}`,
    value,
    domain: ".chatgpt.com",
    path: "/",
  }));
}

export function validateChatGptCookieJson(raw: string): {
  ok: boolean;
  error?: string;
  header?: string;
  normalizedJson?: string;
  meta: CookieMeta;
} {
  const trimmed = raw.trim();
  const issues: string[] = [];

  if (!trimmed) {
    return {
      ok: false,
      error: "请粘贴 ChatGPT session JSON 或 Cookie JSON",
      meta: { count: 0, domains: [], totalValueChars: 0, formatStatus: "INVALID", issues: ["EMPTY"] },
    };
  }

  if (trimmed.length > MAX_COOKIE_JSON_CHARS) {
    return {
      ok: false,
      error: "Cookie JSON 太长，请确认没有粘贴其他网站数据",
      meta: { count: 0, domains: [], totalValueChars: 0, formatStatus: "INVALID", issues: ["TOO_LONG"] },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      error: "JSON 格式不正确",
      meta: { count: 0, domains: [], totalValueChars: 0, formatStatus: "INVALID", issues: ["BAD_JSON"] },
    };
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const sessionPayload = parsed as ChatGptSessionPayload;
    const sessionToken =
      typeof sessionPayload.sessionToken === "string" ? sessionPayload.sessionToken.trim() : "";

    if (!sessionToken) {
      return {
        ok: false,
        error: "没有找到 sessionToken，请确认粘贴的是 ChatGPT session JSON",
        meta: { count: 0, domains: [], totalValueChars: 0, formatStatus: "INVALID", issues: ["NO_SESSION_TOKEN"] },
      };
    }

    if (/[\r\n;]/.test(sessionToken)) {
      return {
        ok: false,
        error: "sessionToken 格式异常",
        meta: { count: 0, domains: [], totalValueChars: 0, formatStatus: "INVALID", issues: ["BAD_SESSION_TOKEN"] },
      };
    }

    const normalized = buildSessionTokenCookies(sessionToken);
    const header = normalized.map((item) => `${item.name}=${item.value}`).join("; ");
    return {
      ok: true,
      header,
      normalizedJson: JSON.stringify(normalized),
      meta: {
        count: normalized.length,
        domains: [".chatgpt.com"],
        totalValueChars: sessionToken.length,
        formatStatus: "VALID_FORMAT",
        issues: [],
      },
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      error: "内容应为 ChatGPT session JSON 对象或 Cookie JSON 数组",
      meta: { count: 0, domains: [], totalValueChars: 0, formatStatus: "INVALID", issues: ["NOT_ARRAY"] },
    };
  }

  if (parsed.length === 0 || parsed.length > MAX_COOKIE_COUNT) {
    return {
      ok: false,
      error: "Cookie 条数异常，请确认只导出了 ChatGPT 相关 cookie",
      meta: {
        count: parsed.length,
        domains: [],
        totalValueChars: 0,
        formatStatus: "INVALID",
        issues: ["COUNT_OUT_OF_RANGE"],
      },
    };
  }

  const normalized: Array<{ name: string; value: string; domain: string; path: string }> = [];
  const domains = new Set<string>();
  let totalValueChars = 0;

  parsed.forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      issues.push(`第 ${index + 1} 条不是 cookie 对象`);
      return;
    }

    const item = entry as EditCookieItem;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const hasValue = typeof item.value === "string";
    const value: string = hasValue ? (item.value as string) : "";
    const domain = typeof item.domain === "string" ? normalizeDomain(item.domain) : "";
    const path = typeof item.path === "string" && item.path.trim() ? item.path.trim() : "/";

    if (!name || !hasValue || !domain) {
      issues.push(`第 ${index + 1} 条缺少 name/value/domain`);
      return;
    }
    if (!isCookieName(name)) {
      issues.push(`第 ${index + 1} 条 cookie name 格式异常`);
      return;
    }
    if (/[\r\n;]/.test(value)) {
      issues.push(`第 ${index + 1} 条 cookie value 包含非法分隔符`);
      return;
    }
    if (!isAllowedDomain(domain)) {
      issues.push(`第 ${index + 1} 条域名不是 chatgpt.com`);
      return;
    }

    domains.add(domain);
    totalValueChars += value.length;
    normalized.push({ name, value, domain, path });
  });

  const meta: CookieMeta = {
    count: normalized.length,
    domains: [...domains].sort(),
    totalValueChars,
    formatStatus: issues.length === 0 ? "VALID_FORMAT" : normalized.length > 0 ? "SUSPICIOUS" : "INVALID",
    issues,
  };

  if (issues.length > 0) {
    return {
      ok: false,
      error: issues[0] ?? "Cookie JSON 检测未通过",
      meta,
    };
  }

  const header = normalized.map((item) => `${item.name}=${item.value}`).join("; ");
  return {
    ok: true,
    header,
    normalizedJson: JSON.stringify(normalized),
    meta,
  };
}

export function serializeCookieMeta(meta: CookieMeta) {
  return JSON.stringify(meta);
}
