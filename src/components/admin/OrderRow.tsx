"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { statusInfo, ADMIN_NEXT_STATUS } from "@/lib/orderStatus";

type Item = { id: string; productName: string; variantName: string; quantity: number };
type AccountInfo = Record<string, unknown>;

export type AdminOrder = {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number;
  currency: string;
  contactEmail: string | null;
  note: string | null;
  createdAt: string;
  accountInfo: string;
  items: Item[];
  userEmail: string;
  userName: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAccountInfo(raw: string): AccountInfo {
  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function valueText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function accountSummary(info: AccountInfo) {
  const parts: string[] = [];

  for (const [group, value] of Object.entries(info)) {
    if (isRecord(value)) {
      for (const [key, fieldValue] of Object.entries(value)) {
        const text = valueText(fieldValue);
        if (!text) continue;
        parts.push(key === "account" ? text : `${key}: ${text}`);
      }
      continue;
    }

    const text = valueText(value);
    if (text) parts.push(group === "account" ? text : `${group}: ${text}`);
  }

  return parts.join(" / ") || "-";
}

export function OrderRow({ order }: { order: AdminOrder }) {
  const router = useRouter();
  const accountInfo = parseAccountInfo(order.accountInfo);
  const itemsText = order.items.map((i) => `${i.productName} ${i.variantName} ×${i.quantity}`).join(" / ");
  const userText = order.userName ? `${order.userName} · ${order.userEmail}` : order.userEmail;
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editTotal, setEditTotal] = useState((order.totalAmount / 100).toFixed(2));
  const [editContactEmail, setEditContactEmail] = useState(order.contactEmail ?? "");
  const [editNote, setEditNote] = useState(order.note ?? "");
  const [editAccountInfo, setEditAccountInfo] = useState(JSON.stringify(accountInfo, null, 2));
  const s = statusInfo(order.status);
  const nexts = ADMIN_NEXT_STATUS[order.status] ?? [];

  async function changeStatus(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
      else {
        const d = await res.json();
        alert(d.error ?? "操作失败");
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    setEditError("");
    const total = Number(editTotal);
    if (!Number.isFinite(total) || total < 0) {
      setEditError("金额格式不正确");
      return;
    }

    try {
      JSON.parse(editAccountInfo);
    } catch {
      setEditError("账号 JSON 格式不正确");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: Math.round(total * 100),
          contactEmail: editContactEmail.trim() || null,
          note: editNote.trim() || null,
          accountInfo: editAccountInfo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "保存失败");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder() {
    const ok = window.confirm(`确认删除订单 ${order.orderNo}？删除后无法恢复。`);
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = await res.json();
      alert(data.error ?? "删除失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-[var(--border)]">
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{order.orderNo}</span>
            <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color: s.color, background: s.bg }}>
              {s.label}
            </span>
            <span className="truncate rounded-md bg-[var(--primary)]/15 px-2 py-0.5 text-xs text-[var(--accent)]">
              {userText}
            </span>
          </div>
          <div className="mt-1 truncate text-sm text-[var(--foreground)]">{itemsText}</div>
          <div className="mt-0.5 text-xs text-[var(--muted)]">
            {new Date(order.createdAt).toLocaleString("zh-CN")}
          </div>
        </div>
        <span className="shrink-0 font-bold text-[var(--accent)]">
          {formatMoney(order.totalAmount, order.currency)}
        </span>
      </div>

      <div className="space-y-3 bg-[var(--surface-2)] p-4 text-sm">
        <div className="grid gap-2 rounded-lg bg-[var(--surface)] p-3 text-xs sm:grid-cols-3">
          <div className="min-w-0">
            <div className="text-[var(--muted)]">账号</div>
            <div className="mt-1 truncate font-medium">{accountSummary(accountInfo)}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[var(--muted)]">联系</div>
            <div className="mt-1 truncate font-medium">{order.contactEmail ?? "-"}</div>
          </div>
          {order.note && (
            <div className="min-w-0">
              <div className="text-[var(--muted)]">备注</div>
              <div className="mt-1 truncate font-medium">{order.note}</div>
            </div>
          )}
        </div>

        {editing ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">金额</label>
                <input
                  className="input"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">联系</label>
                <input
                  className="input"
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-[var(--muted)]">备注</label>
              <textarea
                className="input"
                rows={2}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-[var(--muted)]">账号 JSON</label>
              <textarea
                className="input font-mono text-xs"
                rows={5}
                value={editAccountInfo}
                onChange={(e) => setEditAccountInfo(e.target.value)}
              />
            </div>
            {editError && <p className="mt-2 text-xs text-[var(--danger)]">{editError}</p>}
            <div className="mt-3 flex gap-2">
              <button
                disabled={loading}
                onClick={saveEdit}
                className="btn-primary px-4 py-2 text-sm"
              >
                保存
              </button>
              <button
                disabled={loading}
                onClick={() => setEditing(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-2)]"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              disabled={loading}
              onClick={() => setEditing(true)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--surface)]"
            >
              编辑
            </button>
            <button
              disabled={loading}
              onClick={deleteOrder}
              className="rounded-lg border border-[var(--danger)] px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10"
            >
              删除
            </button>
            {nexts.map((st) => {
              const info = statusInfo(st);
              return (
                <button
                  key={st}
                  disabled={loading}
                  onClick={() => changeStatus(st)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                  style={{ borderColor: info.color, color: info.color }}
                >
                  {info.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
