import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

/**
 * 邀请返利规则集中在这里。
 * 当前规则: 好友绑定邀请码后产生实付消费, 邀请人获得实付金额 2% 的余额返利。
 */
export const INVITE_CONFIG = {
  referralRewardRateBps: 200,
  couponValidDays: 30 as number | null,
} as const;

export const REFERRAL_LEDGER_TYPE = "REFERRAL_REWARD";

export type CouponKind = "WELCOME" | "REFERRAL";
type InviteDb = typeof prisma | Prisma.TransactionClient;

// 邀请码字符集: 去掉易混淆的 0/O/1/I/L
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/** 把用户输入的邀请码标准化(大写、去空格、统一易混淆字符)。 */
export function normalizeInviteCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/L/g, "I");
}

/** 为用户生成唯一邀请码; 已有则原样返回(幂等)。 */
export async function ensureInviteCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { inviteCode: true },
  });
  if (user?.inviteCode) return user.inviteCode;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode(6);
    try {
      await prisma.user.update({ where: { id: userId }, data: { inviteCode: code } });
      return code;
    } catch {
      // 唯一约束冲突, 重试
    }
  }
  throw new Error("INVITE_CODE_GEN_FAILED");
}

/** 根据邀请码找到邀请人; 找不到或为自己时返回 null。 */
export async function findInviterByCode(
  rawCode: string,
  selfUserId?: string
): Promise<{ id: string } | null> {
  const code = normalizeInviteCode(rawCode);
  if (!code) return null;
  const inviter = await prisma.user.findUnique({
    where: { inviteCode: code },
    select: { id: true },
  });
  if (!inviter) return null;
  if (selfUserId && inviter.id === selfUserId) return null;
  return inviter;
}

/** 兼容旧调用。新积分制不再给新用户发优惠券。 */
export async function grantWelcomeCoupon(userId: string, sourceUserId: string) {
  void userId;
  void sourceUserId;
}

export function calculateReferralRewardPoints(amountCents: number) {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return 0;
  return Math.floor((amountCents * INVITE_CONFIG.referralRewardRateBps) / 10_000);
}

function formatYuan(cents: number) {
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

export async function grantReferralPointReward({
  inviterId,
  inviteeId,
  amountCents,
  refType,
  refId,
  tx,
}: {
  inviterId: string;
  inviteeId: string;
  amountCents: number;
  refType: string;
  refId: string;
  tx?: Prisma.TransactionClient;
}) {
  const rewardPoints = calculateReferralRewardPoints(amountCents);
  if (rewardPoints <= 0) return null;

  const db: InviteDb = tx ?? prisma;
  const already = await db.pointLedger.findFirst({
    where: { userId: inviterId, type: REFERRAL_LEDGER_TYPE, refType, refId },
    select: { id: true },
  });
  if (already) return null;

  const updatedUser = await db.user.update({
    where: { id: inviterId },
    data: { pointsBalance: { increment: rewardPoints } },
    select: { pointsBalance: true },
  });

  await db.pointLedger.create({
    data: {
      userId: inviterId,
      type: REFERRAL_LEDGER_TYPE,
      amount: rewardPoints,
      balanceAfter: updatedUser.pointsBalance,
      refType,
      refId,
      note: `邀请返利：好友消费 ¥${formatYuan(amountCents)}，来自 ${inviteeId.slice(0, 8)}`,
    },
  });

  return { rewardPoints, balanceAfter: updatedUser.pointsBalance };
}

export type UsableCoupon = {
  id: string;
  code: string;
  kind: CouponKind;
  amount: number;
  minSpend: number;
  expiresAt: Date | null;
};

/** 列出用户当前可用(未用、未过期、达门槛)的券, 面额高的排前面。 */
export async function listUsableCoupons(
  userId: string,
  subtotalCents?: number
): Promise<UsableCoupon[]> {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      userId,
      status: "UNUSED",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(subtotalCents != null ? { minSpend: { lte: subtotalCents } } : {}),
    },
    orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
    select: { id: true, code: true, kind: true, amount: true, minSpend: true, expiresAt: true },
  });
  return coupons as UsableCoupon[];
}
