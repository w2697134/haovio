import crypto from "crypto";

export const CARD_CODE_STATUSES = [
  "UNUSED",
  "SUBMITTED",
  "RECHARGED",
  "COMPLETED",
  "INFO_INVALID",
  "VOID",
] as const;

export const CARD_REDEEM_STATUSES = [
  "PENDING",
  "PROCESSING",
  "RECHARGED_PENDING_CANCEL",
  "COMPLETED",
  "INFO_INVALID",
  "VOID",
] as const;

export const RENEWAL_STATUSES = ["PENDING_CANCEL", "CANCELLED", "NOT_NEEDED"] as const;

export type CardCodeStatus = (typeof CARD_CODE_STATUSES)[number];
export type CardRedeemStatus = (typeof CARD_REDEEM_STATUSES)[number];
export type RenewalStatus = (typeof RENEWAL_STATUSES)[number];

export const CARD_REDEEM_STATUS_LABEL: Record<CardRedeemStatus, string> = {
  PENDING: "待处理",
  PROCESSING: "处理中",
  RECHARGED_PENDING_CANCEL: "已充值，待取消续订",
  COMPLETED: "已取消续订，完成",
  INFO_INVALID: "信息有误",
  VOID: "已作废",
};

export const CARD_CODE_STATUS_LABEL: Record<CardCodeStatus, string> = {
  UNUSED: "未使用",
  SUBMITTED: "已提交",
  RECHARGED: "已充值",
  COMPLETED: "已完成",
  INFO_INVALID: "信息有误",
  VOID: "已作废",
};

export const RENEWAL_STATUS_LABEL: Record<RenewalStatus, string> = {
  PENDING_CANCEL: "待取消续订",
  CANCELLED: "已取消续订",
  NOT_NEEDED: "无需取消",
};

export type CookieMeta = {
  count: number;
  domains: string[];
  totalValueChars: number;
  formatStatus: "VALID_FORMAT" | "SUSPICIOUS" | "INVALID";
  issues: string[];
};

type EditCookieItem = {
  name?: unknown;
  value?: unknown;
  domain?: unknown;
  path?: unknown;
};

const ALLOWED_DOMAINS = new Set(["chatgpt.com", ".chatgpt.com"]);
const MAX_COOKIE_COUNT = 100;
const MAX_COOKIE_JSON_CHARS = 80_000;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

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

export function decryptSensitiveText(payload: string): string {
  if (!payload) return "";
  const [version, ivRaw, tagRaw, encryptedRaw] = payload.split(":");
  if (version !== "v1" || !ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("INVALID_CIPHER");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivRaw, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
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
      error: "请粘贴 edit-cookie 导出的 JSON",
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
      error: "Cookie JSON 格式不正确",
      meta: { count: 0, domains: [], totalValueChars: 0, formatStatus: "INVALID", issues: ["BAD_JSON"] },
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      error: "edit-cookie 导出内容应为 JSON 数组",
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
    const value = typeof item.value === "string" ? item.value : "";
    const domain = typeof item.domain === "string" ? normalizeDomain(item.domain) : "";
    const path = typeof item.path === "string" && item.path.trim() ? item.path.trim() : "/";

    if (!name || !value || !domain) {
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

export function parseCookieMeta(raw: string | null | undefined): CookieMeta {
  if (!raw) return { count: 0, domains: [], totalValueChars: 0, formatStatus: "INVALID", issues: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<CookieMeta>;
    return {
      count: typeof parsed.count === "number" ? parsed.count : 0,
      domains: Array.isArray(parsed.domains) ? parsed.domains.map(String) : [],
      totalValueChars: typeof parsed.totalValueChars === "number" ? parsed.totalValueChars : 0,
      formatStatus:
        parsed.formatStatus === "VALID_FORMAT" ||
        parsed.formatStatus === "SUSPICIOUS" ||
        parsed.formatStatus === "INVALID"
          ? parsed.formatStatus
          : "INVALID",
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
    };
  } catch {
    return { count: 0, domains: [], totalValueChars: 0, formatStatus: "INVALID", issues: [] };
  }
}

export function generateCardCode() {
  let code = "HV";
  for (let i = 0; i < 12; i++) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    if (i === 3 || i === 7) code += "-";
  }
  return code;
}

export function normalizeCardCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function cardStatusForRedeemStatus(status: CardRedeemStatus): CardCodeStatus {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "RECHARGED_PENDING_CANCEL") return "RECHARGED";
  if (status === "INFO_INVALID") return "INFO_INVALID";
  if (status === "VOID") return "VOID";
  return "SUBMITTED";
}

export function productTierKey(input: string | null | undefined): "PLUS" | "PRO_5X" | "PRO_20X" | null {
  if (!input) return null;
  const text = input.toUpperCase().replace(/\s+/g, "");
  if (text.includes("PRO20X") || text.includes("PRO20")) return "PRO_20X";
  if (text.includes("PRO5X") || text.includes("PRO5")) return "PRO_5X";
  if (text.includes("PLUS")) return "PLUS";
  return null;
}

export function defaultClearAfterDate(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d;
}
