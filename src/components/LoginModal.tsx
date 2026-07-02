"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AuthForm } from "@/components/AuthForm";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="登录或注册"
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/35 px-4 py-6 backdrop-blur-sm sm:py-8"
    >
      <div className="relative max-h-[calc(100dvh-3rem)] w-full max-w-[408px] overflow-y-auto rounded-[26px] border border-white/70 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭登录弹窗"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <CloseIcon />
        </button>
        <div className="pt-3">
          <AuthForm mode="login" variant="modal" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
