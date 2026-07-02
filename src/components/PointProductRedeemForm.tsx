"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { formatMoney } from "@/lib/money";
import { emitClientEvent } from "@/lib/clientEvents";

type ResultState =
  | { ok: false; message: string }
  | { ok: true; message: string };

type SupportContact = {
  platform: string;
  account: string;
};

type CookieAccount = {
  email: string | null;
  name: string | null;
  id: string | null;
};

type CookieCheckState =
  | { ok: false; message: string }
  | { ok: true; message: string; account: CookieAccount };

type SessionPayload = {
  sessionToken?: unknown;
  user?: {
    email?: unknown;
    name?: unknown;
    id?: unknown;
  };
};

function parseSessionAccount(raw: string): CookieCheckState {
  if (!raw.trim()) return { ok: false, message: "请先粘贴完整 Session 内容" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "格式不正确，请粘贴完整 Session JSON" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, message: "格式不正确，请粘贴完整 Session JSON" };
  }

  const session = parsed as SessionPayload;
  const sessionToken = typeof session.sessionToken === "string" ? session.sessionToken.trim() : "";
  if (!sessionToken) return { ok: false, message: "没有找到 sessionToken，请确认内容完整" };

  const account = {
    email: typeof session.user?.email === "string" ? session.user.email : null,
    name: typeof session.user?.name === "string" ? session.user.name : null,
    id: typeof session.user?.id === "string" ? session.user.id : null,
  };

  if (!account.email && !account.name && !account.id) {
    return { ok: false, message: "没有读取到账号或名称，请确认内容完整" };
  }

  return { ok: true, message: "", account };
}

export function PointProductRedeemForm({
  variantId,
  productName,
  variantName,
  pointsCost,
  priceCents,
  currency,
  balance,
  supportContact,
}: {
  variantId: string;
  productName: string;
  variantName: string;
  pointsCost: number;
  priceCents: number;
  currency: string;
  balance: number;
  supportContact?: SupportContact | null;
}) {
  const router = useRouter();
  const [contactType, setContactType] = useState<"QQ" | "WECHAT">("QQ");
  const [contactValue, setContactValue] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"COOKIE" | "MANUAL">("COOKIE");
  const [cookieJson, setCookieJson] = useState("");
  const [cookieCheck, setCookieCheck] = useState<CookieCheckState | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  const insufficient = balance < pointsCost;
  const buttonBusy = loading || redirecting;
  const isQqGroup = supportContact?.platform === "QQ群";
  const supportTitle = isQqGroup ? "选择人工协助后，请加入 QQ 群联系群主处理" : "选择人工协助后，请联系 QQ 处理";
  const supportLabel = isQqGroup ? "QQ群" : supportContact?.platform ?? "QQ";
  const priceLabel = formatMoney(priceCents, currency);

  function checkCookie() {
    if (buttonBusy) return;
    setCookieCheck(parseSessionAccount(cookieJson));
  }

  async function submit() {
    if (buttonBusy) return;
    if (deliveryMode === "COOKIE" && !cookieCheck?.ok) {
      checkCookie();
      return;
    }
    if (insufficient) return;

    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/point-redeems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          contactQq: contactType === "QQ" ? contactValue.trim() || undefined : undefined,
          contactWechat: contactType === "WECHAT" ? contactValue.trim() || undefined : undefined,
          deliveryMode,
          cookieJson: deliveryMode === "COOKIE" ? cookieJson : undefined,
          cookieAccount: cookieCheck?.ok ? cookieCheck.account : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "提交失败，请检查后重试" });
        return;
      }

      setRedirecting(true);
      setResult({ ok: true, message: "提交成功，正在跳转..." });
      startTransition(() => {
        router.push(`/redeem/success/${data.id}`);
      });
    } catch {
      setResult({ ok: false, message: "网络错误，请稍后重试" });
    } finally {
      setLoading(false);
    }
  }

  function primaryButtonText() {
    if (redirecting) return "正在提交...";
    if (loading) return "提交中...";
    if (deliveryMode === "COOKIE" && !cookieCheck?.ok) return "识别账号";
    return `确认购买 ${priceLabel}`;
  }

  return (
    <div className="relative">
      {redirecting ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[calc(var(--radius-xl)+4px)] bg-white/72">
          <div className="rounded-2xl border border-[var(--border)] bg-white px-5 py-4 text-center shadow-sm">
            <div className="text-base font-semibold text-[var(--foreground)]">正在提交</div>
            <div className="mt-1 text-sm text-[var(--muted)]">马上进入订单页面</div>
          </div>
        </div>
      ) : null}

      <div className="card space-y-5 p-5">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-lg font-bold text-[var(--foreground)]">{productName} / {variantName}</div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">联系方式</label>
          <div className="flex">
            <select
              className="input !w-36 rounded-r-none border-r-0"
              value={contactType}
              onChange={(event) => setContactType(event.target.value as "QQ" | "WECHAT")}
              disabled={buttonBusy}
            >
              <option value="QQ">QQ</option>
              <option value="WECHAT">微信</option>
            </select>
            <input
              className="input flex-1 rounded-l-none"
              placeholder={contactType === "QQ" ? "填写 QQ 号" : "填写微信号"}
              value={contactValue}
              onChange={(event) => setContactValue(event.target.value)}
              disabled={buttonBusy}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">处理方式</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryMode("COOKIE")}
              disabled={buttonBusy}
              className={
                "rounded-xl border px-4 py-3 text-sm font-semibold transition " +
                (deliveryMode === "COOKIE"
                  ? "border-[var(--primary)] bg-indigo-50 text-[var(--primary)]"
                  : "border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--surface-2)]")
              }
            >
              <span>自助提交</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  emitClientEvent("openCookieTutorial");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    emitClientEvent("openCookieTutorial");
                  }
                }}
                className="ml-2 text-[var(--accent)] hover:underline"
              >
                -&gt; 教程
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMode("MANUAL")}
              disabled={buttonBusy}
              className={
                "rounded-xl border px-4 py-3 text-sm font-semibold transition " +
                (deliveryMode === "MANUAL"
                  ? "border-[var(--primary)] bg-indigo-50 text-[var(--primary)]"
                  : "border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--surface-2)]")
              }
            >
              人工协助
            </button>
          </div>
        </div>

        {deliveryMode === "COOKIE" ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <textarea
              className="input min-h-40 font-mono text-xs"
              placeholder="粘贴整段 Session 内容"
              value={cookieJson}
              onChange={(event) => {
                setCookieJson(event.target.value);
                setCookieCheck(null);
              }}
              disabled={buttonBusy}
            />
            {cookieCheck ? (
              <div
                className={
                  "mt-3 rounded-lg border p-3 text-sm " +
                  (cookieCheck.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-700")
                }
              >
                {cookieCheck.ok ? (
                  <div className="space-y-1 text-sm font-semibold">
                    {cookieCheck.account.email ? <div>账号：{cookieCheck.account.email}</div> : null}
                    {cookieCheck.account.name ? <div>名称：{cookieCheck.account.name}</div> : null}
                    {!cookieCheck.account.email && cookieCheck.account.id ? <div>ID：{cookieCheck.account.id}</div> : null}
                  </div>
                ) : (
                  <div className="font-semibold">{cookieCheck.message}</div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-sm">
            <div className="font-semibold text-[var(--foreground)]">{supportTitle}</div>
            {supportContact?.account ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
                <span>{supportLabel}</span>
                <span className="font-mono text-[var(--foreground)]">{supportContact.account}</span>
              </div>
            ) : null}
          </div>
        )}

        {result ? (
          <div
            className={
              "rounded-lg border p-3 text-sm " +
              (result.ok
                ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
                : "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]")
            }
          >
            {result.message}
          </div>
        ) : null}

        <button
          type="button"
          disabled={buttonBusy || (insufficient && !(deliveryMode === "COOKIE" && !cookieCheck?.ok))}
          onClick={submit}
          className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {primaryButtonText()}
        </button>
      </div>
    </div>
  );
}
