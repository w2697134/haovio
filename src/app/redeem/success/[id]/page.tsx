import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCnyBalance } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { CheckIcon } from "@/components/icons";

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

  const supportGroup = settings.contacts.find((contact) => contact.platform === "QQ群");
  const supportFallback = settings.contacts.find((contact) => contact.platform === "QQ");
  const supportContact = supportGroup ?? supportFallback ?? null;
  const supportLabel = supportContact?.platform === "QQ群" ? "售后群" : supportContact?.platform ?? "售后联系";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10">
      <div className="card w-full space-y-6 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckIcon className="h-7 w-7" strokeWidth={2.4} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">提交成功</h1>
          <p className="text-sm text-[var(--muted)]">订单已提交，请保存订单号并加入售后群。</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
          <div className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">订单号</div>
          <div className="mt-3 break-all font-mono text-lg font-bold text-[var(--foreground)]">{redeem.id}</div>
          <div className="mt-3 text-sm text-[var(--muted)]">
            {redeem.productName} / {redeem.variantName} / {formatCnyBalance(redeem.pointsCost)}
          </div>
          <div className="mt-2 text-xs text-[var(--muted)]">
            提交时间：{new Date(redeem.createdAt).toLocaleString("zh-CN")}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <div className="text-sm font-semibold text-[var(--foreground)]">{supportLabel}</div>
          <div className="mt-3 font-mono text-2xl font-black text-[var(--accent)]">
            {supportContact?.account ?? "暂未配置"}
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">有问题直接找群主，发送订单号即可处理。</p>
        </div>

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
