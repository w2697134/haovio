import Link from "next/link";
import { prisma } from "@/lib/db";
import { HomeSupportCard } from "@/components/HomeSupportCard";
import { TierCard } from "@/components/TierCard";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: 1, title: "选套餐下单", desc: "选 Plus / Pro,填写信息提交" },
  { n: 2, title: "复制单号加 QQ", desc: "发送订单号确认办理" },
  { n: 3, title: "确认后付款充值", desc: "收款后立即充值并通知" },
];

const FAQ = [
  { q: "有质保吗?", a: "正规充值开通,质保期内如订阅无故掉了会处理;但账号违规、反代/镜像、共享外借、异常登录或平台风控导致的问题,不在质保范围。" },
  { q: "多久到账?", a: "真人处理,通常几分钟到一小时内完成。" },
  { q: "怎么付款?", a: "提交订单后复制订单号,添加 QQ 确认办理与付款。" },
  { q: "直充和合租的区别?", a: "直充是你独享账号;合租是 3-4 人共用,更便宜。" },
];

export default async function Home() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        take: 8,
        include: { variants: { orderBy: { price: "asc" } } },
      },
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="my-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:grid md:grid-cols-[minmax(0,1fr)_340px] md:items-stretch md:gap-8 md:p-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col justify-center py-2">
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
            ChatGPT 会员充值
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            个人直充或多人合租,Plus / Pro 自由选择,人工交付。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/c/subscriptions" className="btn-primary px-6 py-3">
              立即选购
            </Link>
            <a
              href="#how"
              className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium hover:bg-[var(--surface-2)]"
            >
              如何购买
            </a>
          </div>
        </div>
        <div className="mt-6 md:mt-0 md:-translate-x-6 lg:-translate-x-10">
          <HomeSupportCard />
        </div>
      </section>

      {categories.map((cat) => (
        <section key={cat.id} className="mb-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-bold">{cat.name}</h2>
            <Link href={`/c/${cat.slug}`} className="text-sm font-medium text-[var(--primary)] hover:underline">
              全部档位 →
            </Link>
          </div>

          <div className="grid gap-8">
            {cat.products.map((product) => (
              <div key={product.id}>
                <div className="mb-3">
                  <h3 className="font-semibold">
                    {product.slug.includes("shared") ? "共享合租" : "个人直充"}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{product.description}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {product.variants.map((variant) => (
                    <TierCard
                      key={variant.id}
                      product={product}
                      variant={variant}
                      note={product.slug.includes("shared") ? "3-4 人共用一个高级号" : "充到你的账号，也可新开单人号"}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section id="how" className="mb-14 scroll-mt-20">
        <h2 className="mb-5 text-xl font-bold">如何购买</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white">
                {s.n}
              </div>
              <div>
                <div className="font-semibold">{s.title}</div>
                <p className="mt-0.5 text-sm text-[var(--muted)]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-5 text-xl font-bold">常见问题</h2>
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-medium">
                {item.q}
                <span className="text-[var(--muted)] transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
