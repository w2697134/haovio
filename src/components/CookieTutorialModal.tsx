"use client";

import { useEffect, useState } from "react";
import { listenClientEvent } from "@/lib/clientEvents";

const steps = [
  {
    title: "复制 Session",
    body: "复制完整的 Session 内容，不要只复制其中一小段。",
    imageLabel: "图片占位：Session 内容",
  },
  {
    title: "回到兑换页",
    body: "打开商品兑换页面，选择“自助提交”。",
    imageLabel: "图片占位：自助提交入口",
  },
  {
    title: "粘贴内容",
    body: "把整段 Session 粘贴到输入框里，到这一步就可以了。",
    imageLabel: "图片占位：Session 输入框",
  },
];

export function CookieTutorialModal() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const current = steps[index];

  useEffect(() => {
    function openModal() {
      setIndex(0);
      setOpen(true);
    }

    return listenClientEvent("openCookieTutorial", openModal);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">自助提交教程</h2>
            <p className="mt-1 text-sm text-slate-500">
              第 {index + 1} 步 / 共 {steps.length} 步
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            关闭
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="grid aspect-video place-items-center bg-slate-100 px-6 text-center">
            <div>
              <div className="text-sm font-semibold text-slate-500">图片占位符</div>
              <div className="mt-2 text-lg font-black text-slate-800">{current.imageLabel}</div>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-white p-5">
            <h3 className="text-xl font-black text-slate-950">{current.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{current.body}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            上一步
          </button>
          <div className="flex gap-1.5">
            {steps.map((step, stepIndex) => (
              <span
                key={step.title}
                className={`h-2 w-2 rounded-full ${stepIndex === index ? "bg-indigo-600" : "bg-slate-300"}`}
              />
            ))}
          </div>
          {index === steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-primary px-5 py-3 text-sm"
            >
              知道了
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((value) => Math.min(steps.length - 1, value + 1))}
              className="btn-primary px-5 py-3 text-sm"
            >
              下一步
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
