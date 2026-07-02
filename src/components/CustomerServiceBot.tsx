"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Contact } from "@/lib/settings";
import { WELCOME, FALLBACK, matchKb } from "@/lib/kb";
import { CloseIcon, PlatformIcon } from "@/components/icons";
import { listenClientEvent } from "@/lib/clientEvents";

type Msg = { role: "bot" | "user"; text: string; contact?: boolean };

function SupportAvatar({ size = 42 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-white to-cyan-50 shadow-sm ring-1 ring-cyan-100"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image src="/images/customer-service-avatar.webp" alt="" width={size} height={size} priority />
    </span>
  );
}

export function CustomerServiceBot({ contacts }: { contacts: Contact[] }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, loading]);

  useEffect(() => {
    function openChat() {
      setOpen(true);
    }

    return listenClientEvent("openCustomerService", openChat);
  }, []);

  function localAnswer(q: string) {
    const entry = matchKb(q) ?? FALLBACK;
    setMsgs((prev) => [...prev, { role: "bot", text: entry.answer, contact: entry.showContact }]);
  }

  async function ask(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");

    const local = matchKb(q);
    if (local?.id === "contact") {
      setMsgs((prev) => [...prev, { role: "user", text: q }, { role: "bot", text: local.answer, contact: true }]);
      return;
    }

    const convo: Msg[] = [...msgs, { role: "user", text: q }];
    setMsgs(convo);
    setLoading(true);
    try {
      const apiMessages = convo
        .slice(-10)
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (data?.reply) {
        const reply: string = data.reply;
        setMsgs((prev) => [
          ...prev,
          { role: "bot", text: reply, contact: Boolean(data.contact) || /QQ|人工|客服|订单号/.test(reply) },
        ]);
      } else {
        localAnswer(q);
      }
    } catch {
      localAnswer(q);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed right-4 top-20 z-50 flex h-[min(520px,calc(100vh-6rem))] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:right-5"
        >
          <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
            <SupportAvatar size={40} />
            <div className="flex-1">
              <div className="text-sm font-bold">haovio 小客服</div>
              <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> 在线为你解答
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="关闭" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
              <CloseIcon className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i}>
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--surface-2)] text-[var(--foreground)]"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
                {m.contact && (
                  <div className="mt-2 space-y-2">
                    {contacts.length === 0 ? (
                      <div className="rounded-lg bg-[var(--surface-2)] p-2 text-xs text-[var(--muted)]">
                        客服尚未配置联系方式
                      </div>
                    ) : (
                      contacts.map((c, ci) => (
                        <div key={ci} className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-2 text-sm">
                          <PlatformIcon platform={c.platform} className="h-4 w-4 text-[var(--primary)]" />
                          <span className="text-xs text-[var(--muted)]">{c.platform}</span>
                          <span className="ml-auto font-mono font-medium">{c.account}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted)]">
                  正在输入…
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex gap-2 p-3"
          >
            <input
              className="input flex-1"
              placeholder="输入你的问题…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading} className="btn-primary px-4 text-sm">
              发送
            </button>
          </form>
        </div>
      )}
    </>
  );
}
