import type { SeedCategory } from "./catalog-types";

export const catalog: SeedCategory[] = [
  {
    slug: "subscriptions",
    name: "GPT 会员",
    description: "直充 / 合租号（3-4人共用）",
    icon: "⭐",
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
          { name: "Plus", price: 14900, cost: 9000 },
          { name: "Pro 5x", price: 73900, cost: 52000 },
          { name: "Pro 20x", price: 129000, cost: 95000 },
        ],
      },
      {
        slug: "chatgpt-shared",
        name: "ChatGPT 合租号",
        description: "3-4人共用一个账号",
        region: "Global",
        deliveryType: "MANUAL",
        currency: "CNY",
        image: "/images/haovio-logo.svg",
        accountFields: [],
        variants: [
          { name: "Plus", price: 4900, cost: 2500 },
          { name: "Pro 20x", price: 47000, cost: 32000 },
        ],
      },
    ],
  },
];
