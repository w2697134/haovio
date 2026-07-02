"use client";

import { useRouter } from "next/navigation";

export function BackButton({ label = "返回" }: { label?: string }) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-white hover:text-[var(--foreground)]"
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}
