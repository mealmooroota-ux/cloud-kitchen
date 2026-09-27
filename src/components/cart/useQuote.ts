"use client";
import { useEffect, useState } from "react";
import { toApiLines, type CartLine } from "./store";

export interface ServerQuote { subtotal_paise: number; discount_paise: number; delivery_fee_paise: number; tax_paise: number; total_paise: number; prep_minutes: number }
/** Always shows the SERVER's numbers. The same calculation runs again at checkout. */
export function useQuote(lines: CartLine[], coupon?: string) {
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sig = JSON.stringify(toApiLines(lines)) + (coupon ?? "");
  useEffect(() => {
    if (lines.length === 0) { setQuote(null); return; }
    const ctl = new AbortController();
    setLoading(true);
    fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: toApiLines(lines), couponCode: coupon || null }), signal: ctl.signal })
      .then(async (r) => { const j = await r.json(); if (!r.ok) { setError(j.error?.message ?? "Couldn’t price your cart."); setQuote(null); } else { setError(null); setQuote(j); } })
      .catch((e) => { if (e.name !== "AbortError") setError("You seem to be offline. Your cart is saved."); })
      .finally(() => setLoading(false));
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return { quote, error, loading };
}
