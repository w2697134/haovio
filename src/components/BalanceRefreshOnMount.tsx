"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { emitClientEvent } from "@/lib/clientEvents";

export function BalanceRefreshOnMount() {
  const router = useRouter();

  useEffect(() => {
    emitClientEvent("balanceChanged");
    router.refresh();
  }, [router]);

  return null;
}
