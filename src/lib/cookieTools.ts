import crypto from "crypto";

export type CookieMeta = {
  count: number;
  domains: string[];
  totalValueChars: number;
  formatStatus: "VALID_FORMAT" | "SUSPICIOUS" | "INVALID";
  issues: string[];
  deliveryMode?: "MANUAL";
};

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

export function serializeCookieMeta(meta: CookieMeta) {
  return JSON.stringify(meta);
}
