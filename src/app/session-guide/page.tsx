import Image from "next/image";
import { BackButton } from "@/components/BackButton";

export const metadata = {
  title: "Session 获取教程 - 好维AI",
  description: "教你获取 ChatGPT Session JSON 并提交给好维AI办理直充。",
};

const steps = [
  {
    title: "1. 先登录 ChatGPT",
    body: "chatgpt.com 登录",
    image: "/images/session-guide/step-1-open-chatgpt.png",
    alt: "打开 ChatGPT 官网并登录账号",
    width: 942,
    height: 467,
  },
  {
    title: "2. 打开 Session 地址",
    body: "打开接口地址",
    code: "https://chatgpt.com/api/auth/session",
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

export default function SessionGuidePage() {
  return (
    <div className="relative px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-4 w-full max-w-6xl -translate-x-1/2 px-4">
        <div className="pointer-events-auto">
          <BackButton />
        </div>
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
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{step.body}</p>
                {step.code ? (
                  <code className="mt-3 block overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-mono text-sm text-[var(--foreground)]">
                    {step.code}
                  </code>
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
