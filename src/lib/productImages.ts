export const HERO_IMAGE = "/images/hero-membership.png";

export const PRODUCT_IMAGES: Record<string, string> = {
  "chatgpt-direct": "/images/haovio-logo.svg",
  "chatgpt-shared": "/images/haovio-logo.svg",
  "chatgpt-plus": "/images/haovio-logo.svg",
  "chatgpt-pro": "/images/haovio-logo.svg",
  "chatgpt-team": "/images/haovio-logo.svg",
  "openai-api-credit": "/images/haovio-logo.svg",
  "sms-activation": "/images/haovio-logo.svg",
};

export function getProductImage(slug: string, image?: string | null) {
  return PRODUCT_IMAGES[slug] || image || null;
}
