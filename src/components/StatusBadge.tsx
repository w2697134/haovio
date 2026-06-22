import { statusInfo } from "@/lib/orderStatus";

export function StatusBadge({ status }: { status: string }) {
  const s = statusInfo(status);
  return (
    <span
      className="rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}
