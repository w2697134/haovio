import { prisma } from "./db";

/**
 * 邀请优惠体系的全部「具体数目」集中在这里。
 * 待用户确定金额后, 只改这一处即可。金额单位均为「分」(1 元 = 100 分)。
 *
 * 规则:
 * - 新用户用某人的邀请码注册 -> 立刻获得「迎新券」(被邀请人优惠)。
 * - 被邀请人的「首单被后台标记完成」-> 邀请人获得「邀请奖励券」(每个被邀请人仅一次)。
 * - 优惠券为固定面额, 一单只能用一张, 订单原价需 >= 使用门槛。
 */
export const INVITE_CONFIG = {
  // 被邀请新人注册即得的迎新券面额(分) —— TODO 待定具体数目
  welcomeCouponCents: 1000, // 示例: ¥10
  // 迎新券使用门槛: 订单原价不低于此值(分), 0 = 无门槛
  welcomeMinSpendCents: 0,

  // 邀请人在「被邀请人首单完成」后获得的奖励券面额(分) —— TODO 待定具体数目
  referralRewardCents: 1000, // 示例: ¥10
  // 奖励券使用门槛(分), 0 = 无门槛
  referralMinSpendCents: 0,

  // 优惠券有效期(天); null 表示永久有效 —— TODO 可按需调整
  couponValidDays: 30 as number | null,
} as const;

export type CouponKind = "WELCOME" | "REFERRAL";

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

function couponExpiry(): Date | null {
  if (INVITE_CONFIG.couponValidDays == null) return null;
  const d = new Date();
  d.setDate(d.getDate() + INVITE_CONFIG.couponValidDays);
  return d;
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

async function genCouponCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = `HV${randomCode(8)}`;
    const exists = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("COUPON_CODE_GEN_FAILED");
}

/** 发放迎新券给被邀请的新用户。 */
export async function grantWelcomeCoupon(userId: string, sourceUserId: string) {
  if (INVITE_CONFIG.welcomeCouponCents <= 0) return;
  await prisma.coupon.create({
    data: {
      code: await genCouponCode(),
      kind: "WELCOME",
      amount: INVITE_CONFIG.welcomeCouponCents,
      minSpend: INVITE_CONFIG.welcomeMinSpendCents,
      sourceUserId,
      expiresAt: couponExpiry(),
      userId,
    },
  });
}

/**
 * 在被邀请人首单完成后, 给邀请人发放奖励券。
 * 幂等: 同一个被邀请人只会触发一次(以 sourceUserId 去重)。
 */
export async function grantReferralReward(inviterId: string, inviteeId: string) {
  if (INVITE_CONFIG.referralRewardCents <= 0) return;
  const already = await prisma.coupon.findFirst({
    where: { userId: inviterId, kind: "REFERRAL", sourceUserId: inviteeId },
    select: { id: true },
  });
  if (already) return;
  await prisma.coupon.create({
    data: {
      code: await genCouponCode(),
      kind: "REFERRAL",
      amount: INVITE_CONFIG.referralRewardCents,
      minSpend: INVITE_CONFIG.referralMinSpendCents,
      sourceUserId: inviteeId,
      expiresAt: couponExpiry(),
      userId: inviterId,
    },
  });
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
