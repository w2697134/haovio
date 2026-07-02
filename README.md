# Haovio Sale

`haovio.com` 的会员下单与余额充值站点。项目使用 Next.js 16 App Router、React 19、Prisma 和 SQLite，自托管在阿里云轻量服务器。

## 功能范围

- 首页按商品分类展示会员档位。
- 未登录点击购买入口时，在当前页打开强制登录弹窗。
- 邮箱验证码登录、注册、绑定邮箱。
- 余额充值、点数兑换、兑换订单状态页。
- VMQFox 支付通知回调。
- 邀请码与邀请关系。
- 在线客服机器人，本地知识库优先，DeepSeek 作为兜底。
- 后台管理商品、设置、订单、点数码、兑换记录和未知问题。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 6
- SQLite
- JWT HttpOnly Cookie
- Resend 邮件验证码
- DeepSeek Chat API

## 本地开发

```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

常用检查：

```bash
npx prisma validate
npx tsc --noEmit --pretty false
npm run build
```

## 环境变量

复制 `.env.example` 为 `.env`，再填入真实值。不要提交真实 `.env`、数据库、API key、私钥、证书或 token。

生产环境变量保存在服务器：

```text
/www/wwwroot/sale/.env
```

生产 SQLite 数据库保存在：

```text
/www/wwwroot/sale/prisma/prod.db
```

## GitHub CI

仓库包含 GitHub Actions：

```text
.github/workflows/ci.yml
```

CI 会执行：

- `npm ci`
- `npx prisma generate`
- `npx prisma migrate deploy`
- `npx tsc --noEmit --pretty false`
- `npm run build`

## 部署

服务器部署说明见：

```text
docs/deploy-from-github.md
```

原则：

- GitHub 保存干净源码。
- 服务器保留生产 `.env` 和 `prisma/prod.db`。
- 先构建成功，再重启 `sale`。
- 不把临时脚本、调试日志、`.next`、`node_modules`、数据库或密钥推到 GitHub。

## 目录

```text
src/app/                 App Router 页面和 API
src/components/          前台、后台和交互组件
src/lib/                 auth、db、money、settings、支付和业务工具
prisma/                  schema、migrations、seed/catalog
public/images/           站点图片资源
docs/                    部署和维护说明
```
