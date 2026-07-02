import crypto from "crypto";

export const POINT_CODE_AMOUNTS = [500, 1000, 2000, 5000, 10000, 15300, 50000, 74600, 100000, 132800] as const;

export const POINT_CODE_STATUSES = ["UNUSED", "USED", "VOID"] as const;
export const POINT_REDEEM_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "INFO_INVALID", "VOID"] as const;

export type PointCodeAmount = (typeof POINT_CODE_AMOUNTS)[number];
export type PointCodeStatus = (typeof POINT_CODE_STATUSES)[number];
export type PointRedeemStatus = (typeof POINT_REDEEM_STATUSES)[number];

export const POINT_CODE_STATUS_LABEL: Record<PointCodeStatus, string> = {
  UNUSED: "未使用",
  USED: "已使用",
  VOID: "已作废",
};

export const POINT_REDEEM_STATUS_LABEL: Record<PointRedeemStatus, string> = {
  PENDING: "待处理",
  PROCESSING: "处理中",
  COMPLETED: "已完成",
  INFO_INVALID: "信息有误",
  VOID: "已作废",
};

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function pointsForPrice(cents: number) {
  return Math.max(0, Math.ceil(cents));
}

export function normalizePointCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function randomBlock(length = 4) {
  let block = "";
  for (let i = 0; i < length; i++) {
    block += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return block;
}

export function generatePointCode(amount: number) {
  return `HWAI-${amount}-${randomBlock()}-${randomBlock()}`;
}

export function isAllowedPointAmount(amount: number): amount is PointCodeAmount {
  return POINT_CODE_AMOUNTS.includes(amount as PointCodeAmount);
}
