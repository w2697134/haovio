import crypto from "crypto";

const ALIPAY_GATEWAY = "https://openapi.alipay.com/gateway.do";

export type AlipayConfig = {
  appId: string;
  appPrivateKey: string;
  alipayPublicKey: string;
  gatewayUrl: string;
  notifyUrl: string;
  returnUrl: string;
};

export type AlipayPayParams = {
  outTradeNo: string;
  subject: string;
  totalAmount: string;
  quitUrl?: string;
};

export function getAlipayConfig(): AlipayConfig {
  const appId = process.env.ALIPAY_APP_ID?.trim();
  const appPrivateKey = process.env.ALIPAY_APP_PRIVATE_KEY?.trim();
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY?.trim();
  const notifyUrl = process.env.ALIPAY_NOTIFY_URL?.trim();
  const returnUrl = process.env.ALIPAY_RETURN_URL?.trim();

  if (!appId || !appPrivateKey || !alipayPublicKey || !notifyUrl || !returnUrl) {
    throw new Error("ALIPAY_NOT_CONFIGURED");
  }

  return {
    appId,
    appPrivateKey: normalizePrivateKey(appPrivateKey),
    alipayPublicKey: normalizePublicKey(alipayPublicKey),
    gatewayUrl: process.env.ALIPAY_GATEWAY_URL?.trim() || ALIPAY_GATEWAY,
    notifyUrl,
    returnUrl,
  };
}

export function isAlipayConfigured() {
  return Boolean(
    process.env.ALIPAY_APP_ID?.trim() &&
      process.env.ALIPAY_APP_PRIVATE_KEY?.trim() &&
      process.env.ALIPAY_PUBLIC_KEY?.trim() &&
      process.env.ALIPAY_NOTIFY_URL?.trim() &&
      process.env.ALIPAY_RETURN_URL?.trim()
  );
}

export function buildAlipayWapPayUrl(config: AlipayConfig, params: AlipayPayParams) {
  const commonParams: Record<string, string> = {
    app_id: config.appId,
    method: "alipay.trade.wap.pay",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: formatAlipayTimestamp(new Date()),
    version: "1.0",
    notify_url: config.notifyUrl,
    return_url: config.returnUrl,
    biz_content: JSON.stringify({
      out_trade_no: params.outTradeNo,
      total_amount: params.totalAmount,
      subject: params.subject,
      product_code: "QUICK_WAP_WAY",
      quit_url: params.quitUrl ?? config.returnUrl,
    }),
  };
  const sign = signAlipayParams(commonParams, config.appPrivateKey);
  const url = new URL(config.gatewayUrl);
  for (const [key, value] of Object.entries({ ...commonParams, sign })) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function signAlipayParams(params: Record<string, string>, privateKey: string) {
  const content = getSignContent(params);
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(content, "utf8");
  signer.end();
  return signer.sign(privateKey, "base64");
}

export function verifyAlipayParams(params: Record<string, string>, publicKey: string) {
  const sign = params.sign;
  if (!sign) return false;
  const content = getSignContent(params);
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(content, "utf8");
  verifier.end();
  return verifier.verify(publicKey, sign, "base64");
}

export function getSignContent(params: Record<string, string>) {
  return Object.entries(params)
    .filter(([key, value]) => key !== "sign" && key !== "sign_type" && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function centsToAlipayAmount(cents: number) {
  return (cents / 100).toFixed(2);
}

export function alipayAmountToCents(amount: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

function normalizePrivateKey(key: string) {
  const normalized = key.replace(/\\n/g, "\n").trim();
  if (normalized.includes("BEGIN")) return normalized;
  return wrapPem(normalized, "PRIVATE KEY");
}

function normalizePublicKey(key: string) {
  const normalized = key.replace(/\\n/g, "\n").trim();
  if (normalized.includes("BEGIN")) return normalized;
  return wrapPem(normalized, "PUBLIC KEY");
}

function wrapPem(base64: string, label: string) {
  const body = base64.replace(/\s+/g, "").match(/.{1,64}/g)?.join("\n") ?? base64;
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}

function formatAlipayTimestamp(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    " ",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
  ].join("");
}
