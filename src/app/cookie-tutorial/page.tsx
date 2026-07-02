import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

export default function CookieTutorialPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeftIcon className="h-4 w-4" />
        返回首页
      </Link>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-white p-6">
        <h1 className="text-2xl font-black text-[var(--foreground)]">Cookie自助教程</h1>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--muted)]">
          <p>1. 使用浏览器登录 ChatGPT 官网账号。</p>
          <p>2. 安装并打开可导出 Cookie 的浏览器插件。</p>
          <p>3. 只导出 ChatGPT 相关 Cookie，复制 JSON 内容。</p>
          <p>4. 回到兑换页面，选择 Cookie自助，把 JSON 粘贴到输入框后提交。</p>
        </div>
      </section>
    </div>
  );
}
