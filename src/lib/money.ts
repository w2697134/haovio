const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
};

export function formatMoney(cents: number, currency = "CNY"): string {
  const symbol = SYMBOLS[currency] ?? "";
  if (currency === "JPY") return `${symbol}${Math.round(cents / 100)}`;
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
