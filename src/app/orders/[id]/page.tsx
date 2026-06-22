import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderSuccessPanel } from "@/components/OrderSuccessPanel";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();
  if (order.userId && (!user || (order.userId !== user.id && user.role !== "ADMIN"))) notFound();

  const settings = await getSettings();

  let accountInfo: Record<string, Record<string, string>> = {};
  try {
    accountInfo = JSON.parse(order.accountInfo);
  } catch {}
  const hasAccountInfo = Object.keys(accountInfo).length > 0;
  const needsContact = order.status === "PENDING" || order.status === "PENDING_PAYMENT";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {user && (
        <Link href="/orders" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← 返回订单列表
        </Link>
      )}

      <div className="card mt-4 p-6">
        {needsContact ? (
          <>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">订单已提交</h1>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {new Date(order.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <OrderSuccessPanel
              orderNo={order.orderNo}
              contacts={settings.contacts}
            />

            <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
              <div className="mb-2 text-sm font-semibold">订单摘要</div>
              <div className="space-y-2 text-sm">
                {order.items.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {i.productName} · {i.variantName} × {i.quantity}
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatMoney(i.unitPrice * i.quantity, order.currency)}
                    </span>
                  </div>
                ))}
              </div>
              {order.discountAmount > 0 && (
                <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-sm text-[var(--accent)]">
                  <span>优惠券抵扣</span>
                  <span>-{formatMoney(order.discountAmount, order.currency)}</span>
                </div>
              )}
              <div className={`flex items-center justify-between ${order.discountAmount > 0 ? "mt-2" : "mt-3 border-t border-[var(--border)] pt-3"}`}>
                <span className="text-sm text-[var(--muted)]">应付总额</span>
                <span className="text-xl font-extrabold text-[var(--accent)]">
                  {formatMoney(order.totalAmount, order.currency)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-sm text-[var(--muted)]">{order.orderNo}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              {new Date(order.createdAt).toLocaleString("zh-CN")}
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-5 divide-y divide-[var(--border)]">
          {order.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{i.productName}</div>
                <div className="text-sm text-[var(--muted)]">{i.variantName} × {i.quantity}</div>
              </div>
              <div className="font-semibold">
                {formatMoney(i.unitPrice * i.quantity, order.currency)}
              </div>
            </div>
          ))}
        </div>

        {order.discountAmount > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm text-[var(--accent)]">
            <span>优惠券抵扣</span>
            <span>-{formatMoney(order.discountAmount, order.currency)}</span>
          </div>
        )}
        <div className={`flex items-center justify-between ${order.discountAmount > 0 ? "mt-2" : "mt-3 border-t border-[var(--border)] pt-4"}`}>
          <span className="text-[var(--muted)]">应付总额</span>
          <span className="text-2xl font-extrabold text-[var(--accent)]">
            {formatMoney(order.totalAmount, order.currency)}
          </span>
        </div>

        <div className="mt-5 space-y-2 rounded-lg bg-[var(--surface-2)] p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">联系方式</span>
            <span>{order.contactEmail ?? "-"}</span>
          </div>
          {order.note && (
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">备注</span>
              <span>{order.note}</span>
            </div>
          )}
          {hasAccountInfo && (
            <div className="border-t border-[var(--border)] pt-2">
              <div className="mb-1 text-[var(--muted)]">代充账号信息</div>
              {Object.entries(accountInfo).map(([slug, fields]) => (
                <div key={slug} className="text-xs">
                  {Object.entries(fields).map(([k, v]) => (
                    <span key={k} className="mr-3">
                      <span className="text-[var(--muted)]">{k}:</span> {v}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          {order.status === "PAID" && (
            <p className="rounded-lg bg-[var(--accent)]/10 p-3 text-center text-sm text-[var(--accent)]">
              已收到付款, 订单号 {order.orderNo}, 等待商家处理
            </p>
          )}
          {order.status === "PROCESSING" && (
            <p className="rounded-lg bg-[var(--primary)]/10 p-3 text-center text-sm text-[var(--primary)]">
              ⏳ 已确认,正在为你充值,请耐心等待
            </p>
          )}
          {order.status === "COMPLETED" && (
            <p className="rounded-lg bg-[var(--success)]/10 p-3 text-center text-sm text-[var(--success)]">
              ✅ 充值已完成,感谢惠顾!
            </p>
          )}
          {order.status === "CANCELLED" && (
            <p className="rounded-lg bg-[var(--surface-2)] p-3 text-center text-sm text-[var(--muted)]">
              该订单已取消
            </p>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
