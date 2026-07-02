const CNY_SYMBOL = "\uFFE5";

const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: CNY_SYMBOL,
};

export function formatMoney(cents: number, currency = "CNY"): string {
  const symbol = SYMBOLS[currency] ?? "";
  if (currency === "JPY") return `${symbol}${Math.round(cents / 100)}`;
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

export function formatCnyBalance(cents: number, compact = false): string {
  const safeCents = Number.isFinite(cents) ? Math.trunc(cents) : 0;
  const absCents = Math.abs(safeCents);
  const sign = safeCents < 0 ? "-" : "";
  const absYuan = absCents / 100;

  if (compact && absYuan >= 100000000) {
    return `${sign}${CNY_SYMBOL}${(absYuan / 100000000).toFixed(2)}亿`;
  }

  if (compact && absYuan >= 10000) {
    return `${sign}${CNY_SYMBOL}${(absYuan / 10000).toFixed(2)}万`;
  }

  return `${sign}${formatMoney(absCents, "CNY")}`;
}

export function parseCnyToCents(value: string | number): number | null {
  const text = String(value).trim();
  if (!/^\d+(\.\d{0,2})?$/.test(text)) return null;

  const [yuan, cent = ""] = text.split(".");
  const cents = Number(yuan) * 100 + Number(cent.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) return null;
  return cents;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
