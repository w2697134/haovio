import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { CustomerServiceBot } from "@/components/CustomerServiceBot";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GPT 会员代充",
  description: "流媒体、效率工具、社交平台会员订阅代开通续费 — 安全快速",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);

  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Header user={user} />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--muted)]">
            <p>haovio 会员代充服务</p>
            <p className="mx-auto mt-2 max-w-2xl px-4 text-xs leading-relaxed">
              本站为独立第三方代购/代充服务,与 OpenAI、ChatGPT 无任何官方合作或授权关联。
              ChatGPT、OpenAI 及相关标识为 OpenAI OpCo, LLC 的商标,本站仅用于描述所提供的服务对象。
            </p>
          </footer>
          <CustomerServiceBot contacts={settings.contacts} />
        </CartProvider>
      </body>
    </html>
  );
}
