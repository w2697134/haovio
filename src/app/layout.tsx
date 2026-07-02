import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { CustomerServiceBot } from "@/components/CustomerServiceBot";
import { CookieTutorialModal } from "@/components/CookieTutorialModal";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "好维AI",
  description: "好维AI 服务中心",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const pointUser = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { pointsBalance: true },
      })
    : null;

  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Header user={user} balance={pointUser?.pointsBalance ?? 0} />
          <main className="flex-1">{children}</main>
          <CustomerServiceBot contacts={settings.contacts} />
          <CookieTutorialModal />
        </CartProvider>
      </body>
    </html>
  );
}
