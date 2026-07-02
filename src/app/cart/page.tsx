"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, type AccountField } from "@/components/CartProvider";
import { formatMoney } from "@/lib/money";
import { CartIcon } from "@/components/icons";

type UsableCoupon = {
  id: string;
  kind: "WELCOME" | "REFERRAL";
  amount: number;
  minSpend: number;
  expiresAt: string | null;
};

const COUPON_KIND_LABEL: Record<string, string> = {
  WELCOME: "迎新券",
  REFERRAL: "邀请奖励券",
};

function visibleAccountFields(fields: AccountField[]) {
  return fields.filter((field) => !["password", "note"].includes(field.key));
}

function displayAccountField(field: AccountField) {
  if (field.key !== "account") return field;
  return {
    ...field,
    label: "GPT账号",
    placeholder: "请输入要充值的账号",
  };
}

function cartItemImage(item: { image?: string | null; productSlug: string }) {
  return item.image || (item.productSlug.includes("chatgpt") ? "/images/haovio-logo.svg" : null);
}

function displaySubmitError(error: unknown) {
  if (typeof error !== "string" || !error.trim()) return "提交失败,请检查信息后重试";
  if (/[a-zA-Z]/.test(error)) return "提交失败,请检查信息后重试";
  return error;
}

export default function CartPage() {
  const { items, total, setQty, removeItem, clear } = useCart();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [accountInfo, setAccountInfo] = useState<Record<string, Record<string, string>>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<UsableCoupon[]>([]);
  const [couponId, setCouponId] = useState<string>("");

  const currency = items[0]?.currency ?? "CNY";

  // 拉取当前用户可用券; 游客返回空列表。仅 CNY 订单展示与使用券。
  useEffect(() => {
    if (items.length === 0 || currency !== "CNY") return;
    let alive = true;
    fetch(`/api/coupons?subtotal=${total}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setCoupons(Array.isArray(d.coupons) ? d.coupons : []);
      })
      .catch(() => {
        if (alive) setCoupons([]);
      });
    return () => {
      alive = false;
    };
  }, [items.length, total, currency]);

  // 选中券若已不在可用列表(如数量变化跌破门槛), 视为未选, 无需额外 setState
  const couponUsable = currency === "CNY";
  const selectedCoupon =
    couponUsable && couponId ? coupons.find((c) => c.id === couponId) ?? null : null;
  const effectiveCouponId = selectedCoupon?.id ?? "";
  const discount = selectedCoupon ? Math.min(selectedCoupon.amount, total) : 0;
  const payable = total - discount;

  function setField(variantId: string, key: string, value: string) {
    setAccountInfo((prev) => ({
      ...prev,
      [variantId]: { ...(prev[variantId] ?? {}), [key]: value },
    }));
  }

  async function submit() {
    setError("");
    for (const it of items) {
      for (const f of visibleAccountFields(it.accountFields)) {
        if (f.required && !accountInfo[it.variantId]?.[f.key]?.trim()) {
          setError(`请填写「${it.productName}」的${displayAccountField(f).label}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          couponId: effectiveCouponId || undefined,
          items: items.map((it) => ({
            variantId: it.variantId,
            quantity: it.quantity,
            accountInfo: accountInfo[it.variantId] ?? {},
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(displaySubmitError(data.error));
        return;
      }
      clear();
      router.push(data.orderUrl ?? `/orders/${data.orderId}`);
    } catch {
      setError("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <CartIcon className="mx-auto h-16 w-16 text-[var(--muted)] opacity-40" strokeWidth={1.5} />
        <p className="mt-4 text-lg text-[var(--muted)]">购物车空空如也</p>
        <Link href="/" className="btn-primary mt-6 inline-block px-6 py-2.5">
          去逛逛
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">购物车结算</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((it) => {
            const fields = visibleAccountFields(it.accountFields).map(displayAccountField);
            const image = cartItemImage(it);

            return (
              <div key={it.variantId} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--surface-2)]">
                    {image ? (
                      <Image
                        src={image}
                        alt={it.productName}
                        fill
                        sizes="56px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <span className="text-sm font-bold text-[var(--muted)]">GPT</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link href={`/p/${it.productSlug}`} className="font-semibold hover:text-[var(--accent)]">
                      {it.productName}
                    </Link>
                    <div className="text-sm text-[var(--muted)]">{it.variantName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--accent)]">
                      {formatMoney(it.unitPrice * it.quantity, it.currency)}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-[var(--border)] text-sm">
                        <button onClick={() => setQty(it.variantId, it.quantity - 1)} className="px-2 py-0.5">−</button>
                        <span className="w-7 text-center">{it.quantity}</span>
                        <button onClick={() => setQty(it.variantId, it.quantity + 1)} className="px-2 py-0.5">+</button>
                      </div>
                      <button onClick={() => removeItem(it.variantId)} className="text-xs text-[var(--danger)]">
                        删除
                      </button>
                    </div>
                  </div>
                </div>

                {fields.length > 0 && (
                  <div className="mt-3 border-t border-[var(--border)] pt-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {fields.map((f) => (
                        <div key={f.key}>
                          <label className="mb-1 block text-xs text-[var(--muted)]">
                            {f.label} {f.required && <span className="text-[var(--danger)]">*</span>}
                          </label>
                          <input
                            className="input"
                            placeholder={f.placeholder ?? ""}
                            value={accountInfo[it.variantId]?.[f.key] ?? ""}
                            onChange={(e) => setField(it.variantId, f.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            {couponUsable && coupons.length > 0 && (
              <div className="mb-4">
                <label className="mb-1 block text-sm text-[var(--muted)]">优惠券</label>
                <select
                  className="input"
                  value={effectiveCouponId}
                  onChange={(e) => setCouponId(e.target.value)}
                >
                  <option value="">不使用优惠券</option>
                  {coupons.map((c) => (
                    <option key={c.id} value={c.id}>
                      {COUPON_KIND_LABEL[c.kind] ?? c.kind} · 减 {formatMoney(c.amount)}
                      {c.minSpend > 0 ? `(满 ${formatMoney(c.minSpend)})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">原价</span>
                <span>{formatMoney(total, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-[var(--accent)]">
                  <span>优惠</span>
                  <span>-{formatMoney(discount, currency)}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
              <span className="text-[var(--muted)]">实付</span>
              <span className="text-2xl font-extrabold text-[var(--accent)]">
                {formatMoney(payable, currency)}
              </span>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm text-[var(--muted)]">备注</label>
              <textarea
                className="input"
                maxLength={500}
                placeholder="有特殊要求可以写这里"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

            <button onClick={submit} disabled={loading} className="btn-primary mt-4 w-full py-3">
              {loading ? "提交中..." : "提交订单"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
