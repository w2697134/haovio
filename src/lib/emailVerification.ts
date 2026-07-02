import crypto from "crypto";

const CODE_TTL_MINUTES = 10;
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateEmailCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashEmailCode(email: string, code: string) {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  return crypto.createHash("sha256").update(`${normalizeEmail(email)}:${code}:${secret}`).digest("hex");
}

export function emailCodeExpiresAt(from = new Date()) {
  return new Date(from.getTime() + CODE_TTL_MINUTES * 60 * 1000);
}

export async function sendVerificationEmail({
  to,
  code,
  scene = "验证",
}: {
  to: string;
  code: string;
  scene?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_NOT_CONFIGURED");
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "Haovio AI <noreply@haovio.com>";
  const subject = `好维AI ${scene}`;
  const text = `您的验证码是：${code}\n\n10 分钟内有效，请勿转发给他人。`;

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html: `
        <div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;color:#172033">
          <div style="font-size:18px;font-weight:700;margin-bottom:12px">好维AI ${scene}</div>
          <div>您的验证码是：</div>
          <div style="font-size:30px;font-weight:800;letter-spacing:6px;margin:14px 0">${code}</div>
          <div style="color:#64748b">10 分钟内有效，请勿转发给他人。</div>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    throw new Error("EMAIL_SEND_FAILED");
  }
}
