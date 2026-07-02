import crypto from "crypto";

export const POINT_PURCHASE_AMOUNTS = [5, 10, 50, 100, 500, 1000] as const;
export const MIN_POINT_PURCHASE_AMOUNT_CENTS = 500;
export const MAX_POINT_PURCHASE_AMOUNT_CENTS = 100_000_000;
export const POINT_PURCHASE_TTL_MINUTES = 10;

export function centsToYuan(cents: number) {
  return (cents / 100).toFixed(2);
}

export function yuanToCents(value: string | number) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{0,2})?$/.test(text)) return null;
  const [yuan, cent = ""] = text.split(".");
  const cents = Number(yuan) * 100 + Number(cent.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) return null;
  return cents;
}

export function generatePointPurchaseNo() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  return `P${stamp}${crypto.randomInt(1000, 10000)}`;
}

export function pointPurchaseExpiresAt(from = new Date()) {
  return new Date(from.getTime() + POINT_PURCHASE_TTL_MINUTES * 60 * 1000);
}

export function assertAllowedPointPurchaseAmount(amountCents: number) {
  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents < MIN_POINT_PURCHASE_AMOUNT_CENTS ||
    amountCents > MAX_POINT_PURCHASE_AMOUNT_CENTS
  ) {
    throw new Error("POINT_AMOUNT_NOT_ALLOWED");
  }
}

export function getPaymentTypeLabel(type: string) {
  if (type === "1") return "微信";
  if (type === "2") return "支付宝";
  return "支付";
}

export function signVmqCreateOrder({
  payId,
  param,
  type,
  price,
  key,
}: {
  payId: string;
  param: string;
  type: string;
  price: string;
  key: string;
}) {
  return crypto.createHash("md5").update(`${payId}${param}${type}${price}${key}`).digest("hex");
}

export function signVmqCallback({
  payId,
  param,
  type,
  price,
  reallyPrice,
  key,
}: {
  payId: string;
  param: string;
  type: string;
  price: string;
  reallyPrice: string;
  key: string;
}) {
  return crypto.createHash("md5").update(`${payId}${param}${type}${price}${reallyPrice}${key}`).digest("hex");
}
