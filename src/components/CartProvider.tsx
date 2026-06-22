"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type AccountField = {
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
};

export type CartItem = {
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  unitPrice: number;
  currency: string;
  image?: string | null;
  deliveryType: string;
  accountFields: AccountField[];
  quantity: number;
};

type CartContext = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartContext | null>(null);
const KEY = "sale_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {}
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.variantId === item.variantId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(1, qty) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <Ctx.Provider value={{ items, count, total, addItem, removeItem, setQty, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart 必须在 CartProvider 内使用");
  return ctx;
}
