"use client";

import Image from "next/image";

export function HomeSupportCard() {
  function openChat() {
    window.dispatchEvent(new Event("open-customer-service"));
  }

  return (
    <button
      type="button"
      onClick={openChat}
      className="h-full min-h-[210px] w-full rounded-2xl border border-[var(--border)] bg-white/90 p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"
    >
      <div className="flex h-full flex-col items-center justify-center gap-5">
        <span className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-cyan-50 ring-1 ring-cyan-100">
          <Image
            src="/images/customer-service-avatar.webp"
            alt="在线客服"
            width={88}
            height={88}
            priority
          />
        </span>
        <div className="min-w-0">
          <div className="text-2xl font-bold">在线客服</div>
        </div>
      </div>
    </button>
  );
}
