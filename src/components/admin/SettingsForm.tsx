"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact } from "@/lib/settings";

const PLATFORMS = ["QQ", "QQ群", "Telegram", "WhatsApp", "邮箱"];

export function SettingsForm({
  initialContacts,
  initialQrUrl,
  initialInstruction,
}: {
  initialContacts: Contact[];
  initialQrUrl: string | null;
  initialInstruction: string;
}) {
  void initialQrUrl;
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(
    initialContacts.length ? initialContacts : [{ platform: "QQ", account: "" }]
  );
  const [instruction, setInstruction] = useState(initialInstruction);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function setContact(i: number, patch: Partial<Contact>) {
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addContact() {
    setContacts((prev) => [...prev, { platform: "QQ", account: "" }]);
  }
  function removeContact(i: number) {
    setContacts((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: contacts.filter((c) => c.account.trim()),
          qrUrl: null,
          instruction,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "保存失败");
        return;
      }
      setMsg("✓ 已保存");
      router.refresh();
    } catch {
      setMsg("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">客服联系方式</h3>
            <p className="text-xs text-[var(--muted)]">顾客下单后会看到这些方式,引导加你完成充值</p>
          </div>
          <button onClick={addContact} className="text-sm text-[var(--accent)]">+ 添加</button>
        </div>
        {contacts.map((c, i) => (
          <div key={i} className="grid gap-2 rounded-lg bg-[var(--surface-2)] p-3 sm:grid-cols-[112px_minmax(0,1fr)_auto]">
            <select
              className="input"
              value={c.platform}
              onChange={(e) => setContact(i, { platform: e.target.value })}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              className="input"
              placeholder="账号 / 号码 / 用户名"
              value={c.account}
              onChange={(e) => setContact(i, { account: e.target.value })}
            />
            <button onClick={() => removeContact(i)} className="shrink-0 text-sm text-[var(--danger)]">删除</button>
          </div>
        ))}
      </div>

      <div className="card space-y-3 p-5">
        <h3 className="font-semibold">下单后提示语</h3>
        <textarea
          className="input"
          rows={3}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={loading} className="btn-primary px-6 py-2.5">
          {loading ? "保存中..." : "保存设置"}
        </button>
        {msg && <span className="text-sm text-[var(--success)]">{msg}</span>}
      </div>
    </div>
  );
}
