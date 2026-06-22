export const ORDER_STATUS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING_PAYMENT: { label: "待支付", color: "var(--warning)", bg: "rgba(251,191,36,0.15)" },
  PAID: { label: "已付款", color: "var(--accent)", bg: "rgba(8,145,178,0.14)" },
  PENDING: { label: "待联系", color: "var(--warning)", bg: "rgba(251,191,36,0.15)" },
  PROCESSING: { label: "充值中", color: "var(--primary)", bg: "rgba(99,102,241,0.18)" },
  COMPLETED: { label: "已完成", color: "var(--success)", bg: "rgba(52,211,153,0.15)" },
  CANCELLED: { label: "已取消", color: "var(--muted)", bg: "rgba(148,163,184,0.15)" },
};

export function statusInfo(status: string) {
  return ORDER_STATUS[status] ?? { label: status, color: "var(--muted)", bg: "rgba(148,163,184,0.15)" };
}

export const ADMIN_NEXT_STATUS: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
