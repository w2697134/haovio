import Link from "next/link";
import { CardRedeemForm } from "@/components/CardRedeemForm";

export const dynamic = "force-dynamic";

export default async function RedeemPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; variant?: string }>;
}) {
  const { product, variant } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← 返回首页
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold">卡密兑换</h1>
      </div>

      <CardRedeemForm product={product} variant={variant} expectedProductType={variant} />
    </div>
  );
}
