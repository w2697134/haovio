"use client";

import Image from "next/image";
import { useState } from "react";
import { emitClientEvent } from "@/lib/clientEvents";
import { CheckIcon, CopyIcon } from "@/components/icons";

type HomeHeroProps = {
  qqGroup?: string | null;
  supportWechat?: string | null;
  supportQq?: string | null;
};

function HeroDecor() {
  // 装饰层：流动丝带波纹 + 光晕 + 星点，纯 SVG，绝对定位铺满 hero
  const sparkles = [
    [120, 110, 2.2, 0.85], [300, 70, 1.4, 0.7], [520, 140, 1.8, 0.6],
    [760, 90, 2.6, 0.9], [980, 150, 1.5, 0.7], [1080, 80, 2, 0.8],
    [200, 300, 1.6, 0.6], [430, 360, 2.2, 0.75], [660, 320, 1.4, 0.6],
    [900, 360, 2, 0.7], [1130, 300, 1.6, 0.65], [80, 220, 1.8, 0.6],
  ];
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 480"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="hv-wave-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4b5fd" stopOpacity="0.32" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hv-wave-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a5d8ff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#a5d8ff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hv-orb-a" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a5b4fc" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a5b4fc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hv-orb-b" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.5" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0" />
        </radialGradient>
        <filter id="hv-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* 光晕球 */}
      <circle className="hv-orb-a" cx="170" cy="150" r="180" fill="url(#hv-orb-a)" />
      <circle className="hv-orb-b" cx="1040" cy="350" r="200" fill="url(#hv-orb-b)" />

      {/* 柔和波浪（底部色块，融入背景） */}
      <g filter="url(#hv-soft)">
        <path
          d="M-40 392 C 240 348 460 430 720 392 S 1060 356 1240 398 L1240 520 L-40 520 Z"
          fill="url(#hv-wave-b)"
        />
        <path
          d="M-40 426 C 220 386 440 460 700 420 S 1080 392 1240 432 L1240 520 L-40 520 Z"
          fill="url(#hv-wave-a)"
        />
      </g>

      {/* 星点 */}
      <g fill="#ffffff">
        {sparkles.map(([x, y, r, o], i) => (
          <circle key={i} cx={x} cy={y} r={r} opacity={o} />
        ))}
      </g>
    </svg>
  );
}

export function HomeHero({ qqGroup, supportWechat, supportQq }: HomeHeroProps) {
  const [copied, setCopied] = useState("");

  function openCustomerService() {
    emitClientEvent("openCustomerService");
  }

  async function copyContact(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1500);
  }

  const contactItems = [
    supportWechat ? { label: "客服微信", value: supportWechat, prominent: false } : null,
    qqGroup ? { label: "售后QQ群", value: qqGroup, prominent: true } : null,
    supportQq ? { label: "客服QQ", value: supportQq, prominent: false } : null,
  ].filter((item): item is { label: string; value: string; prominent: boolean } => Boolean(item));

  return (
    <section className="haovio-hero relative my-10 overflow-hidden rounded-3xl border border-white/70 p-10 md:p-16">
      <HeroDecor />
      <div className="relative flex min-h-[340px] flex-col items-center justify-center gap-9">
        <h1 className="haovio-ai-title flex items-center justify-center gap-3 text-7xl font-black tracking-tight md:gap-5 md:text-[8.5rem]">
          好维&nbsp;AI
        </h1>
        <button
          type="button"
          onClick={openCustomerService}
          className="group inline-flex items-center gap-4 rounded-full border border-white/80 bg-white/85 px-7 py-4 text-xl font-bold text-[var(--foreground)] shadow-[0_12px_30px_rgba(15,23,42,0.10)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_42px_rgba(99,102,241,0.20)]"
        >
          <span className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-cyan-50 to-indigo-50 ring-1 ring-cyan-100">
            <Image
              src="/images/customer-service-avatar.webp"
              alt=""
              width={48}
              height={48}
              priority
            />
            <span className="haovio-status-dot absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
          </span>
          <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
            在线客服
          </span>
        </button>
        {contactItems.length > 0 ? (
          <div className="-mt-3 flex max-w-full flex-wrap items-center justify-center gap-2">
            {contactItems.map((item) => (
              <button
                type="button"
                key={item.label}
                onClick={() => copyContact(item.value, item.label)}
                className={
                  "inline-flex items-center gap-2 rounded-full font-medium backdrop-blur transition " +
                  (item.prominent
                    ? "min-h-11 bg-white px-5 py-2 text-base text-indigo-700 shadow-[0_10px_28px_rgba(79,70,229,0.18)] ring-2 ring-indigo-300 hover:ring-indigo-400"
                    : "min-h-9 bg-white/60 px-4 py-1.5 text-sm text-slate-500 ring-1 ring-white/70 hover:bg-white hover:text-slate-700 hover:ring-slate-200")
                }
                title={`复制${item.label}`}
                aria-label={`复制${item.label} ${item.value}`}
              >
                <span className={item.prominent ? "font-semibold text-indigo-500" : "text-slate-400"}>
                  {item.label}
                </span>
                <span className={item.prominent ? "font-black tracking-wide text-indigo-800" : "font-semibold tracking-wide text-slate-700"}>
                  {item.value}
                </span>
                <span
                  className={
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full transition " +
                    (copied === item.label
                      ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                      : item.prominent
                        ? "bg-indigo-600 text-white ring-1 ring-indigo-500"
                        : "bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100")
                  }
                  aria-hidden="true"
                >
                  {copied === item.label ? (
                    <CheckIcon className={item.prominent ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={2.4} />
                  ) : (
                    <CopyIcon className={item.prominent ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={2} />
                  )}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
