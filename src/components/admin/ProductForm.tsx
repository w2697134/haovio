"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };

type VariantInput = {
  name: string;
  price: string;
  cost: string;
  currency: string;
  stock: string;
};

type AccountFieldInput = {
  key: string;
  label: string;
  required: boolean;
  placeholder: string;
};

export type ProductFormInitial = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  region: string;
  status: string;
  categoryId: string;
  accountFields: AccountFieldInput[];
  variants: VariantInput[];
};

const empty: ProductFormInitial = {
  slug: "",
  name: "",
  description: "",
  region: "Global",
  status: "ACTIVE",
  categoryId: "",
  accountFields: [],
  variants: [{ name: "", price: "", cost: "", currency: "CNY", stock: "-1" }],
};

export function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: ProductFormInitial;
}) {
  const router = useRouter();
  const [f, setF] = useState<ProductFormInitial>(() =>
    initial ?? { ...empty, categoryId: categories[0]?.id ?? "" }
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial?.id;

  function up<K extends keyof ProductFormInitial>(k: K, v: ProductFormInitial[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function setVariant(i: number, patch: Partial<VariantInput>) {
    setF((prev) => {
      const variants = [...prev.variants];
      variants[i] = { ...variants[i], ...patch };
      return { ...prev, variants };
    });
  }
  function addVariant() {
    setF((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: "", price: "", cost: "", currency: "CNY", stock: "-1" }],
    }));
  }
  function removeVariant(i: number) {
    setF((prev) => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));
  }

  function setField(i: number, patch: Partial<AccountFieldInput>) {
    setF((prev) => {
      const accountFields = [...prev.accountFields];
      accountFields[i] = { ...accountFields[i], ...patch };
      return { ...prev, accountFields };
    });
  }
  function addField() {
    setF((prev) => ({
      ...prev,
      accountFields: [...prev.accountFields, { key: "", label: "", required: true, placeholder: "" }],
    }));
  }
  function removeField(i: number) {
    setF((prev) => ({ ...prev, accountFields: prev.accountFields.filter((_, idx) => idx !== i) }));
  }

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const payload = {
        slug: f.slug.trim(),
        name: f.name.trim(),
        description: f.description,
        region: f.region,
        status: f.status,
        categoryId: f.categoryId,
        accountFields: f.accountFields
          .filter((a) => a.key && a.label)
          .map((a) => ({
            key: a.key.trim(),
            label: a.label.trim(),
            required: a.required,
            placeholder: a.placeholder || undefined,
          })),
        variants: f.variants
          .filter((v) => v.name)
          .map((v) => ({
            name: v.name.trim(),
            price: Math.round(parseFloat(v.price || "0") * 100),
            cost: Math.round(parseFloat(v.cost || "0") * 100),
            currency: v.currency || "CNY",
            stock: parseInt(v.stock || "-1", 10),
          })),
      };

      const url = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="card space-y-4 p-5">
        <h3 className="font-semibold">基本信息</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">商品名称</label>
            <input className="input" value={f.name} onChange={(e) => up("name", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Slug(唯一,英文)</label>
            <input className="input" value={f.slug} onChange={(e) => up("slug", e.target.value)} placeholder="amazon-us-gift-card" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">描述</label>
          <textarea className="input" rows={2} value={f.description} onChange={(e) => up("description", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">分类</label>
            <select className="input" value={f.categoryId} onChange={(e) => up("categoryId", e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">区域</label>
            <input className="input" value={f.region} onChange={(e) => up("region", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">状态</label>
            <select className="input" value={f.status} onChange={(e) => up("status", e.target.value)}>
              <option value="ACTIVE">上架</option>
              <option value="HIDDEN">下架</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">规格 / 面值</h3>
          <button onClick={addVariant} className="text-sm text-[var(--accent)]">+ 添加规格</button>
        </div>
        {f.variants.map((v, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
            <input className="input sm:col-span-2" placeholder="规格名 如 $25" value={v.name} onChange={(e) => setVariant(i, { name: e.target.value })} />
            <input className="input" placeholder="售价" value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} />
            <input className="input" placeholder="成本" value={v.cost} onChange={(e) => setVariant(i, { cost: e.target.value })} />
            <input className="input" placeholder="币种" value={v.currency} onChange={(e) => setVariant(i, { currency: e.target.value })} />
            <button onClick={() => removeVariant(i)} className="text-sm text-[var(--danger)]">删除</button>
          </div>
        ))}
        <p className="text-xs text-[var(--muted)]">售价/成本以货币单位填写(如 25 表示 ¥25),库存 -1 为不限量。</p>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">下单需填写的代充字段</h3>
          <button onClick={addField} className="text-sm text-[var(--accent)]">+ 添加字段</button>
        </div>
        {f.accountFields.length === 0 && (
          <p className="text-sm text-[var(--muted)]">未添加字段时，买家下单无需填写额外信息。</p>
        )}
        {f.accountFields.map((a, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <input className="input" placeholder="key 如 uid" value={a.key} onChange={(e) => setField(i, { key: e.target.value })} />
            <input className="input" placeholder="显示名 如 游戏UID" value={a.label} onChange={(e) => setField(i, { label: e.target.value })} />
            <input className="input sm:col-span-2" placeholder="提示文字" value={a.placeholder} onChange={(e) => setField(i, { placeholder: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <input type="checkbox" checked={a.required} onChange={(e) => setField(i, { required: e.target.checked })} />
              必填
              <button onClick={() => removeField(i)} className="ml-2 text-[var(--danger)]">删除</button>
            </label>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex gap-3">
        <button onClick={submit} disabled={loading} className="btn-primary px-6 py-2.5">
          {loading ? "保存中..." : isEdit ? "保存修改" : "创建商品"}
        </button>
        <button onClick={() => router.back()} className="rounded-lg border border-[var(--border)] px-6 py-2.5">
          取消
        </button>
      </div>
    </div>
  );
}
