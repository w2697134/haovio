import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCnyBalance } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { CheckIcon } from "@/components/icons";
import { RedeemOrderCopyPanel } from "@/components/RedeemOrderCopyPanel";
import { BalanceRefreshOnMount } from "@/components/BalanceRefreshOnMount";

export const dynamic = "force-dynamic";

export default async function RedeemSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user, settings] = await Promise.all([
    params,
    getCurrentUser(),
    getSettings(),
  ]);

  const redeem = await prisma.pointRedeem.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      productName: true,
      variantName: true,
      pointsCost: true,
    },
  });

  if (!redeem) notFound();
  if (!user || redeem.userId !== user.id) notFound();

  const supportGroup = settings.contacts.find((contact) => contact.platform === "QQ群")?.account ?? null;
  const supportWechat = settings.contacts.find((contact) => contact.platform === "微信")?.account ?? null;
  const details = `${redeem.productName} / ${redeem.variantName} / ${formatCnyBalance(redeem.pointsCost)}`;
  const createdAtText = new Date(redeem.createdAt).toLocaleString("zh-CN");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10">
      <BalanceRefreshOnMount />
      <div className="card w-full space-y-6 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckIcon className="h-7 w-7" strokeWidth={2.4} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">购买成功</h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            这是人工交付订单，已进入处理队列。
          </p>
        </div>

        <RedeemOrderCopyPanel
          orderId={redeem.id}
          details={details}
          createdAtText={createdAtText}
          qqGroupAccount={supportGroup}
          wechatAccount={supportWechat}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn-primary flex-1 py-3 text-center">
            返回首页
          </Link>
          <Link
            href="/account#redeems"
            className="flex-1 rounded-2xl border border-[var(--border)] px-5 py-3 text-center text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-2)]"
          >
            查看兑换记录
          </Link>
        </div>
      </div>
    </div>
  );
}
