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
];
