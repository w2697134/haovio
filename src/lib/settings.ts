import { prisma } from "./db";

export type Contact = { platform: string; account: string; qrUrl?: string | null };

export type SiteSettings = {
  contacts: Contact[];
  qrUrl: string | null;
  instruction: string;
};

const DEFAULT_INSTRUCTION =
  "复制订单号,添加 QQ 确认办理与付款;完成后可加入 QQ 群处理售后。";

export async function getSettings(): Promise<SiteSettings> {
  const row = await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, contacts: "[]", instruction: DEFAULT_INSTRUCTION },
  });

  let contacts: Contact[] = [];
  try {
    contacts = JSON.parse(row.contacts);
  } catch {}

  return {
    contacts,
    qrUrl: row.qrUrl,
    instruction: row.instruction || DEFAULT_INSTRUCTION,
  };
}
