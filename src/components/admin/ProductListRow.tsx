"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/money";

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  status: string;
  categoryName: string;
  minPrice: number;
  currency: string;
  variantCount: number;
};

export function ProductListRow({ product }: { product: AdminProduct }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const active = product.status === "ACTIVE";

  async function toggle() {
    setBusy(true);
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: active ? "HIDDEN" : "ACTIVE" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`确定删除「${product.name}」?此操作不可撤销。`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("删除失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]">
      <td className="p-3">
        <div className="font-medium">{product.name}</div>
        <div className="font-mono text-xs text-[var(--muted)]">{product.slug}</div>
      </td>
      <td className="p-3 text-sm text-[var(--muted)]">{product.categoryName}</td>
      <td className="p-3 text-sm">
        {formatMoney(product.minPrice, product.currency)} 起 · {product.variantCount} 规格
      </td>
      <td className="p-3">
        <button
          onClick={toggle}
          disabled={busy}
          className={`rounded-md px-2 py-1 text-xs font-semibold ${
            active
              ? "bg-[var(--success)]/15 text-[var(--success)]"
              : "bg-[var(--muted)]/15 text-[var(--muted)]"
          }`}
        >
          {active ? "已上架" : "已下架"}
        </button>
      </td>
      <td className="p-3 text-right text-sm">
        <Link href={`/admin/products/${product.id}/edit`} className="text-[var(--accent)] hover:underline">
          编辑
        </Link>
        <button onClick={remove} disabled={busy} className="ml-3 text-[var(--danger)] hover:underline">
          删除
        </button>
      </td>
    </tr>
  );
}
