import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, ExternalLinkIcon } from "@/components/icons";

export const metadata = {
  title: "Session 获取教程 - 好维AI",
  description: "教你获取 ChatGPT Session JSON 并提交给好维AI办理直充。",
};

const steps = [
  {
    title: "1. 先登录 ChatGPT",
    body: "打开浏览器，进入 chatgpt.com，确认你的 ChatGPT 账号已经登录成功。",
    image: "/images/session-guide/step-1-open-chatgpt.png",
    alt: "打开 ChatGPT 官网并登录账号",
    width: 942,
    height: 467,
  },
  {
    title: "2. 打开 Session 地址",
    body: "登录好以后，在浏览器地址栏输入下面这个地址，然后按回车。",
    code: "https://chatgpt.com/api/auth/session",
    image: "/images/session-guide/step-2-open-session-url.png",
    alt: "在地址栏打开 ChatGPT Session 接口地址",
    width: 2560,
    height: 1528,
  },
  {
    title: "3. 复制整段内容",
    body: "页面会出来一大段 JSON，不用看懂，直接全选复制。回到我们网站，把整段内容粘贴到 Session 提交框里，点检测 Cookie。",
    image: "/images/session-guide/step-3-copy-json.png",
    alt: "复制 ChatGPT Session JSON 内容",
    width: 2559,
    height: 1017,
  },
];

export default function SessionGuidePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        返回首页
      </Link>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black text-[var(--primary)]">直充 Session 提交</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
              ChatGPT Session 获取教程
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              按下面三步操作，把复制到的整段 JSON 粘贴回订单页面即可。Session 相当于账号登录凭证，只能提交到网站，不要发到群里，也不要私发给别人。
            </p>
          </div>
          <a
            href="https://chatgpt.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)]"
          >
            打开 ChatGPT
            <ExternalLinkIcon className="h-4 w-4" />
          </a>
        </div>
      </section>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
        注意：教程图里的 Session 已打码。你自己的 Session 不要截图发群里，不要发给陌生人，只在网站订单里粘贴提交。
      </div>

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

      <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
        <h2 className="text-base font-black">粘贴以后怎么做</h2>
        <p className="mt-2">
          回到订单页面，选择 Session 提交，把复制的整段 JSON 粘贴进去，先点检测 Cookie。检测通过后再提交订单；如果余额不够，网站会自动按差额弹出充值窗口。
        </p>
      </section>
    </div>
  );
}
