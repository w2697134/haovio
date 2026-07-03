const FIVE_SIM_BASE_URL = "https://5sim.net/v1";

type FiveSimSms = {
  code?: string | null;
  text?: string | null;
};

export type FiveSimOrder = {
  id: number;
  phone?: string | null;
  operator?: string | null;
  product?: string | null;
  price?: number | null;
  status?: string | null;
  expires?: string | null;
  sms?: FiveSimSms[];
};

function getFiveSimToken() {
  const token = process.env.FIVESIM_API_KEY || process.env.FIVE_SIM_API_KEY;
  if (!token) throw new Error("FIVESIM_NOT_CONFIGURED");
  return token;
}

async function fiveSimRequest<T>(path: string): Promise<T> {
  const res = await fetch(`${FIVE_SIM_BASE_URL}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${getFiveSimToken()}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = typeof data?.message === "string" ? data.message : typeof data === "string" ? data : "FIVESIM_ERROR";
    throw new Error(message);
  }
  return data as T;
}

export function extractSmsCode(order: Pick<FiveSimOrder, "sms">) {
  const sms = order.sms?.find((item) => item.code || item.text);
  return {
    code: sms?.code?.trim() || null,
    text: sms?.text?.trim() || null,
  };
}

export async function buyFiveSimActivation({
  country,
  operator,
  product,
}: {
  country: string;
  operator: string;
  product: string;
}) {
  return fiveSimRequest<FiveSimOrder>(`/user/buy/activation/${country}/${operator}/${product}`);
}

export async function checkFiveSimOrder(providerOrderId: string) {
  return fiveSimRequest<FiveSimOrder>(`/user/check/${providerOrderId}`);
}

export async function finishFiveSimOrder(providerOrderId: string) {
  return fiveSimRequest<FiveSimOrder>(`/user/finish/${providerOrderId}`);
}

export async function cancelFiveSimOrder(providerOrderId: string) {
  return fiveSimRequest<FiveSimOrder>(`/user/cancel/${providerOrderId}`);
}
