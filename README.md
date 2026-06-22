# haovio · GPT 会员服务

这是 `haovio.com` 当前线上使用的 GPT 会员下单站。项目聚焦 ChatGPT 个人直充和合租号，走人工交付流程：用户下单后复制订单号，添加客服确认付款，后台处理并更新订单状态。

## 当前线上范围

- 线上地址：[https://haovio.com/](https://haovio.com/)
- 后台入口：`/admin-login`
- 服务器项目目录：`/www/wwwroot/sale`
- systemd 服务：`sale`
- 当前商品：ChatGPT 个人直充、ChatGPT 合租号
- 当前客服：顶部“在线客服”入口 + 首页客服卡片 + DeepSeek/本地知识库兜底

## 技术栈

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS 4
- Prisma 6 + SQLite
- JWT HttpOnly Cookie + bcrypt
- DeepSeek Chat API 用于在线客服问答

## 本地启动

```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

常用检查：

```bash
npx tsc --noEmit --pretty false
npm run build
npx eslint src prisma --max-warnings=0
```

`npm run lint` 会从项目根目录扫描；本地如果有 `.next`、`.codex`、`output` 等生成目录，优先使用上面的限定范围命令。

## 主要功能

前台：

- 首页按“个人直充”和“共享合租”分区展示，一个档位一张卡片
- 分类页 `/c/subscriptions`
- 商品详情页 `/p/[slug]?v=<variantId>`，从档位卡片进入后自动选中对应规格
- 购物车结算，直充只收 GPT 账号，密码/付款信息由客服私下确认
- 游客可下单；登录用户可在 `/orders` 查看自己的订单
- 下单成功页展示订单号和客服联系方式，支持复制订单号

后台：

- `/admin-login` 使用管理员密钥登录
- `/admin/orders` 订单管理：全部/未完成/已完成筛选，订单号搜索，编辑、删除、改状态
- `/admin/products` 商品管理：商品和规格增删改查
- `/admin/settings` 客服联系方式和下单提示语
- `/admin/questions` 记录客服机器人答不上来的问题，便于补知识库

客服知识库：

- 本地规则在 `src/lib/kb.ts`
- DeepSeek 系统提示词也在 `src/lib/kb.ts`
- 未覆盖问题由模型返回 `UNKNOWN`，接口会记录到 `UnknownQuestion`
- 当前已覆盖价格、购买流程、直充/合租区别、Pro 20x 2 人起拼团、付款方式、账号安全、售后、退款、客服时间等

## 当前商品档位

| 类型 | 档位 | 价格 |
|---|---:|---:|
| 个人直充 | Plus | ¥149/月 |
| 个人直充 | Pro 5x | ¥739/月 |
| 个人直充 | Pro 20x | ¥1290/月 |
| 合租号（3-4人） | Plus | ¥49/月 |
| 合租号（3-4人） | Pro 20x | ¥470/月 |

个人直充文案：充到你的账号，也可新开单人号。

## 订单状态

当前人工交付主流程：

```text
PENDING（待联系） -> PROCESSING（充值中） -> COMPLETED（已完成）
```

后台也保留取消流程：

```text
PENDING / PAID / PROCESSING -> CANCELLED
```

`/pay/[id]` 和 placeholder payment API 仍保留在代码里，属于早期占位支付入口；当前线上主流程不是自动支付，而是下单后联系 QQ/客服确认付款。

## 目录

```text
src/
  app/
    page.tsx                  首页
    c/[slug]/page.tsx          分类页
    p/[slug]/page.tsx          商品详情
    cart/page.tsx              购物车结算
    orders/                    用户订单
    admin-login/page.tsx       管理员密钥登录
    admin/                     后台页面
    api/                       订单、后台、认证、客服接口
  components/                  前台组件、客服组件、后台组件
  lib/                         auth、db、money、settings、kb 等
prisma/
  schema.prisma                数据模型
  catalog.ts                   当前商品目录种子数据
  migrations/                  SQLite 迁移
public/images/                 站点图片资源
```

## 部署注意

生产服务器信息、部署路径和验证记录以本机服务器记忆为准：

```text
C:\Users\admin\.codex\memories\xiangdongqu-aliyun-server.md
```

部署前先读服务器记忆。不要把 `.env`、真实 API key、管理员密钥、数据库、证书私钥写进文档、聊天、日志或提交记录。
