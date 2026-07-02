import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCnyBalance } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { CheckIcon } from "@/components/icons";
import { RedeemOrderCopyPanel } from "@/components/RedeemOrderCopyPanel";

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
  const handlerName = supportContact?.platform === "QQ群" ? "群主" : "客服";
  const details = `${redeem.productName} / ${redeem.variantName} / ${formatCnyBalance(redeem.pointsCost)}`;
  const createdAtText = new Date(redeem.createdAt).toLocaleString("zh-CN");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10">
      <div className="card w-full space-y-6 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckIcon className="h-7 w-7" strokeWidth={2.4} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">提交成功</h1>
          <p className="text-sm text-[var(--muted)]">订单号已生成，复制后发给{handlerName}处理。</p>
        </div>

        <RedeemOrderCopyPanel
          orderId={redeem.id}
          details={details}
          createdAtText={createdAtText}
          supportLabel={supportLabel}
          supportAccount={supportContact?.account ?? null}
          handlerName={handlerName}
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
