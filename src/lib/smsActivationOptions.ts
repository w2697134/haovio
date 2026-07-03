export const SMS_ACTIVATION_SERVICES = [
  { code: "openai", label: "OpenAI / ChatGPT" },
] as const;

export const SMS_ACTIVATION_COUNTRIES = [
  { code: "usa", label: "美国" },
  { code: "vietnam", label: "越南" },
] as const;

export const SMS_ACTIVATION_OPERATORS = [
  { code: "any", label: "自动匹配" },
] as const;

export type SmsActivationServiceCode = (typeof SMS_ACTIVATION_SERVICES)[number]["code"];
export type SmsActivationCountryCode = (typeof SMS_ACTIVATION_COUNTRIES)[number]["code"];
export type SmsActivationOperatorCode = (typeof SMS_ACTIVATION_OPERATORS)[number]["code"];

export function isSmsActivationService(code: string): code is SmsActivationServiceCode {
  return SMS_ACTIVATION_SERVICES.some((item) => item.code === code);
}

export function isSmsActivationCountry(code: string): code is SmsActivationCountryCode {
  return SMS_ACTIVATION_COUNTRIES.some((item) => item.code === code);
}

export function isSmsActivationOperator(code: string): code is SmsActivationOperatorCode {
  return SMS_ACTIVATION_OPERATORS.some((item) => item.code === code);
}

export function getSmsActivationServiceLabel(code: string) {
  return SMS_ACTIVATION_SERVICES.find((item) => item.code === code)?.label ?? code;
}

export function getSmsActivationCountryLabel(code: string) {
  return SMS_ACTIVATION_COUNTRIES.find((item) => item.code === code)?.label ?? code;
}

export function getSmsActivationOperatorLabel(code: string) {
  return SMS_ACTIVATION_OPERATORS.find((item) => item.code === code)?.label ?? code;
}
