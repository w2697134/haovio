"use client";

import Image from "next/image";

export function HomeHero() {
  function openCustomerService() {
    window.dispatchEvent(new Event("open-customer-service"));
  }

  return (
    <section className="haovio-hero my-10 rounded-3xl border border-white/70 p-10 md:p-16">
      <div className="relative flex min-h-[340px] flex-col items-center justify-center gap-9">
        <h1 className="haovio-ai-logo bg-gradient-to-r from-indigo-500 via-fuchsia-400 to-cyan-400 bg-clip-text text-7xl font-black tracking-[0.14em] text-transparent md:text-9xl">
          好维AI
        </h1>
        <button
          type="button"
          onClick={openCustomerService}
          className="inline-flex items-center gap-4 rounded-full border border-white/80 bg-white/80 px-7 py-4 text-xl font-bold text-[var(--foreground)] shadow-[0_12px_30px_rgba(15,23,42,0.10)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-cyan-50 ring-1 ring-cyan-100">
            <Image
              src="/images/customer-service-avatar.webp"
              alt=""
              width={48}
              height={48}
              priority
            />
          </span>
          在线客服
        </button>
      </div>
    </section>
  );
}
