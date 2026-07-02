import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PointRedeemRow, type AdminPointRedeem } from "@/components/admin/PointRedeemRow";

export async function AdminPointRedeemList({
  title,
  action,
  where,
  searchParams,
}: {
  title: string;
  action: string;
  where: Prisma.PointRedeemWhereInput;
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const finalWhere: Prisma.PointRedeemWhereInput = { ...where };

  if (query) {
    finalWhere.OR = [
      { id: { contains: query } },
      { productName: { contains: query } },
      { variantName: { contains: query } },
      { contactQq: { contains: query } },
      { contactWechat: { contains: query } },
      { user: { email: { contains: query } } },
    ];
  }

  const redeems = await prisma.pointRedeem.findMany({
    where: finalWhere,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const data: AdminPointRedeem[] = redeems.map((redeem) => ({
    id: redeem.id,
    status: redeem.status,
    productName: redeem.productName,
    variantName: redeem.variantName,
    pointsCost: redeem.pointsCost,
    contactQq: redeem.contactQq,
    contactWechat: redeem.contactWechat,
    createdAt: redeem.createdAt.toISOString(),
    user: redeem.user,
  }));

  return (
    <div>
      <form action={action} className="mb-6 flex justify-end gap-3">
        <input
          name="q"
          defaultValue={query}
          className="input h-12 !w-80 bg-white text-sm shadow-sm"
          placeholder="订单号 / 商品 / QQ / 微信 / 邮箱"
        />
        <button className="btn-primary h-12 px-7 text-sm">搜索</button>
      </form>

      <section className="card p-7">
        <h2 className="mb-5 text-2xl font-extrabold">{title}</h2>
        {data.length === 0 ? (
          <p className="p-10 text-center text-[var(--muted)]">暂无</p>
        ) : (
          <div className="space-y-4">
            {data.map((redeem) => <PointRedeemRow key={redeem.id} redeem={redeem} />)}
          </div>
        )}
      </section>
    </div>
  );
}
