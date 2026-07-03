import Image from "next/image";
import { BackButton } from "@/components/BackButton";

export const metadata = {
  title: "Session 获取教程 - 好维AI",
  description: "教你获取 ChatGPT Session JSON 并提交给好维AI办理直充。",
};

const steps = [
  {
    title: "1. 先登录 ChatGPT",
    code: "https://chatgpt.com",
    href: "https://chatgpt.com",
    image: "/images/session-guide/step-1-open-chatgpt.png",
    alt: "打开 ChatGPT 官网并登录账号",
    width: 942,
    height: 467,
  },
  {
    title: "2. 打开 Session 地址",
    body: "把地址栏网址换成下面这个",
    code: "https://chatgpt.com/api/auth/session",
    href: "https://chatgpt.com/api/auth/session",
    image: "/images/session-guide/step-2-open-session-url.png",
    alt: "在地址栏打开 ChatGPT Session 接口地址",
    width: 2560,
    height: 1528,
  },
  {
    title: "3. 复制整段内容",
    body: "全选复制 JSON",
    image: "/images/session-guide/step-3-copy-json.png",
    alt: "复制 ChatGPT Session JSON 内容",
    width: 2559,
    height: 1017,
  },
];

function ExternalLinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export default function SessionGuidePage() {
  return (
    <div className="px-4 py-8 sm:py-10">
      <div className="mx-auto mb-5 max-w-6xl">
        <BackButton />
      </div>

      <div className="mx-auto max-w-5xl">
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
            ChatGPT Session 获取教程
          </h1>
        </section>

        <section className="mt-6 grid gap-5">
          {steps.map((step) => (
            <article key={step.title} className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <h2 className="text-xl font-black text-[var(--foreground)]">{step.title}</h2>
                {step.body ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{step.body}</p> : null}
                {step.code ? (
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex min-h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--foreground)] transition hover:border-[var(--primary)]"
                  >
                    <span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">{step.code}</span>
                    <span className="text-[var(--muted)]">
                      <ExternalLinkIcon />
                    </span>
                  </a>
                ) : null}
              </div>
              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                <Image
                  src={step.image}
                  alt={step.alt}
                  width={step.width}
                  height={step.height}
                  sizes="(max-width: 768px) 100vw, 960px"
                  className="h-auto w-full"
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
