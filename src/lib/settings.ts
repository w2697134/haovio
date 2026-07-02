import { prisma } from "./db";

export type Contact = { platform: string; account: string; qrUrl?: string | null };

export type SiteSettings = {
  contacts: Contact[];
  qrUrl: string | null;
  instruction: string;
};

const DEFAULT_INSTRUCTION =
  "复制订单号,添加 QQ 确认办理与付款;完成后可加入 QQ 群处理售后。";

const DEFAULT_CONTACTS: Contact[] = [
  { platform: "微信", account: "f2697134653" },
  { platform: "QQ", account: "2697134653" },
];

function withDefaultContacts(contacts: Contact[]) {
  const next = [...contacts];
  for (const fallback of DEFAULT_CONTACTS) {
    if (!next.some((contact) => contact.platform === fallback.platform && contact.account.trim())) {
      next.push(fallback);
    }
  }
  return next;
}

export async function getSettings(): Promise<SiteSettings> {
  const row = await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, contacts: JSON.stringify(DEFAULT_CONTACTS), instruction: DEFAULT_INSTRUCTION },
  });

  let contacts: Contact[] = [];
  try {
    contacts = JSON.parse(row.contacts);
  } catch {}

  return {
    contacts: withDefaultContacts(contacts),
    qrUrl: row.qrUrl,
    instruction: row.instruction || DEFAULT_INSTRUCTION,
  };
}
