import type { SeedCategory } from "./catalog-types";

export const catalog: SeedCategory[] = [
  {
    slug: "subscriptions",
    name: "GPT 会员",
    description: "个人直充 / Plus 合租",
    icon: "AI",
    products: [
      {
        slug: "chatgpt-direct",
        name: "ChatGPT 个人直充",
        description: "充到你的账号，也可新开单人号",
        region: "Global",
        deliveryType: "MANUAL",
        currency: "CNY",
        image: "/images/haovio-logo.svg",
        accountFields: [
          { key: "account", label: "GPT账号", required: true, placeholder: "请输入要充值的账号" },
        ],
        variants: [
          { name: "Plus", price: 15300, cost: 9000 },
          { name: "Pro 5x", price: 74600, cost: 52000 },
          { name: "Pro 20x", price: 132800, cost: 95000 },
        ],
      },
      {
        slug: "chatgpt-shared",
        name: "ChatGPT Plus 合租号",
        description: "3-4 人共用一个 Plus 高级号",
        region: "Global",
        deliveryType: "MANUAL",
        currency: "CNY",
        image: "/images/haovio-logo.svg",
        accountFields: [],
        variants: [
          { name: "Plus", price: 5200, cost: 2500 },
        ],
      },
    ],
  },
  {
    slug: "other-services",
    name: "其他服务",
    description: "海外手机号 / 验证码辅助",
    icon: "SIM",
    products: [
      {
        slug: "sms-activation",
        name: "海外手机号接码",
        description: "用于接收海外平台一次性验证码，适合 OpenAI / ChatGPT 注册验证。",
        region: "Global",
        deliveryType: "MANUAL",
        currency: "CNY",
        image: "/images/haovio-logo.svg",
        accountFields: [
          { key: "target", label: "接码用途", required: false, placeholder: "例如 OpenAI / ChatGPT" },
        ],
        variants: [
          { name: "OpenAI 接码", price: 500, cost: 150 },
        ],
      },
    ],
  },
];
