"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

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

  return {
    ok: true,
    message: "Session 已识别",
    account: {
      email: typeof session.user?.email === "string" ? session.user.email : null,
      name: typeof session.user?.name === "string" ? session.user.name : null,
      id: typeof session.user?.id === "string" ? session.user.id : null,
    },
  };
}

export function PointProductRedeemForm({
  variantId,
  productName,
  variantName,
  pointsCost,
  balance,
  supportContact,
  allowsSessionDelivery,
}: {
  variantId: string;
  productName: string;
  variantName: string;
  pointsCost: number;
  balance: number;
  supportContact?: SupportContact | null;
  allowsSessionDelivery: boolean;
}) {
  const router = useRouter();
  const [contactType, setContactType] = useState<"QQ" | "WECHAT">("QQ");
  const [contactValue, setContactValue] = useState("");
  const [sessionJson, setSessionJson] = useState("");
  const [sessionCheck, setSessionCheck] = useState<CookieCheckState | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"COOKIE" | "MANUAL">(
    allowsSessionDelivery ? "COOKIE" : "MANUAL"
  );
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  const insufficient = balance < pointsCost;
  const buttonBusy = loading || redirecting;
  const activeDeliveryMode = allowsSessionDelivery ? deliveryMode : "MANUAL";
  const isSessionDelivery = activeDeliveryMode === "COOKIE";
  const isQqGroup = supportContact?.platform === "QQ群";
  const handlerName = isQqGroup ? "群主" : "客服";
  const supportTitle = `提交后会立刻生成订单号，请复制给${handlerName}处理`;
  const supportLabel = isQqGroup ? "QQ群" : supportContact?.platform ?? "QQ";

  async function submit() {
    if (buttonBusy) return;

    if (isSessionDelivery && !sessionCheck?.ok) {
      const checkedSession = parseSessionAccount(sessionJson);
      setSessionCheck(checkedSession);
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
          deliveryMode: activeDeliveryMode,
          cookieJson: isSessionDelivery ? sessionJson : undefined,
          cookieAccount: isSessionDelivery && sessionCheck?.ok ? sessionCheck.account : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "提交失败，请检查后重试" });
        return;
      }

      setRedirecting(true);
      setResult({ ok: true, message: "提交成功，马上生成订单号..." });
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
    if (isSessionDelivery && !sessionCheck?.ok) return "检测 Cookie";
    if (insufficient) return "余额不足";
    return "提交订单";
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
          {allowsSessionDelivery ? (
            <div className="rounded-xl border border-[var(--primary)] bg-indigo-50 p-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["COOKIE", "Session 提交"],
                  ["MANUAL", "人工交付"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={buttonBusy}
                    onClick={() => {
                      setDeliveryMode(value as "COOKIE" | "MANUAL");
                      setResult(null);
                    }}
                    className={
                      "rounded-lg border px-3 py-2 text-left font-semibold transition " +
                      (activeDeliveryMode === value
                        ? "border-[var(--primary)] bg-white text-[var(--primary)]"
                        : "border-[var(--border)] bg-white/60 text-[var(--muted)] hover:border-[var(--primary)]/50")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              {isSessionDelivery ? (
                <>
                  <textarea
                    className="input mt-3 min-h-40 bg-white font-mono text-xs"
                    placeholder="ChatGPT Session JSON"
                    value={sessionJson}
                    onChange={(event) => {
                      setSessionJson(event.target.value);
                      setSessionCheck(null);
                    }}
                    disabled={buttonBusy}
                  />
                  {sessionCheck ? (
                    <div
                      className={
                        "mt-3 rounded-lg border p-3 text-sm " +
                        (sessionCheck.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-rose-200 bg-rose-50 text-rose-700")
                      }
                    >
                      {sessionCheck.ok ? (
                        <div className="space-y-1 font-semibold">
                          {sessionCheck.account.email ? <div>账号：{sessionCheck.account.email}</div> : null}
                          {sessionCheck.account.name ? <div>名称：{sessionCheck.account.name}</div> : null}
                          {!sessionCheck.account.email && sessionCheck.account.id ? <div>ID：{sessionCheck.account.id}</div> : null}
                          {!sessionCheck.account.email && !sessionCheck.account.name && !sessionCheck.account.id ? (
                            <div>Session 已识别</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="font-semibold">{sessionCheck.message}</div>
                      )}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-3 rounded-lg border border-[var(--border)] bg-white/70 p-3 text-[var(--foreground)]">
                  {supportTitle}
                  {supportContact?.account ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
                      <span>{supportLabel}</span>
                      <span className="font-mono text-[var(--foreground)]">{supportContact.account}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--primary)] bg-indigo-50 p-4 text-sm">
              <div className="font-semibold text-[var(--primary)]">人工交付</div>
              <p className="mt-2 text-[var(--foreground)]">{supportTitle}</p>
              {supportContact?.account ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
                  <span>{supportLabel}</span>
                  <span className="font-mono text-[var(--foreground)]">{supportContact.account}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

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
          disabled={buttonBusy || (insufficient && !(isSessionDelivery && !sessionCheck?.ok))}
          onClick={submit}
          className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {primaryButtonText()}
        </button>
      </div>
    </div>
  );
}
