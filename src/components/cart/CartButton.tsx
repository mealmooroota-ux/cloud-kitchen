"use client";
import Link from "next/link";
import { useCart } from "./store";

export function CartButton() {
  const lines = useCart();
  const n = lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <Link href="/cart" className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-line-strong px-3 text-sm font-semibold hover:bg-raised sm:px-4" aria-label={`Cart, ${n} items`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 8h14l-1 12H6z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
      <span className="hidden sm:inline">Cart</span>{n > 0 && <span className="tabular grid min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs text-on-brand">{n}</span>}
    </Link>
  );
}

/** Floating cart bar on phones, in the thumb zone. */
export function MobileCartBar() {
  const lines = useCart();
  const n = lines.reduce((s, l) => s + l.quantity, 0);
  if (n === 0) return null;
  const total = lines.reduce((s, l) => s + l.unitPaise * l.quantity, 0);
  return (
    <Link href="/cart" className="mobile-bottom-bar fixed inset-x-4 z-40 flex h-14 items-center justify-between rounded-full bg-brand px-6 text-on-brand shadow-[0_16px_40px_rgba(31,27,22,.22)] md:hidden"
      style={{ bottom: "max(16px, env(safe-area-inset-bottom))" }}>
      <span className="truncate text-[15px] font-semibold">{n} {n === 1 ? "item" : "items"} · <span className="tabular font-mono font-medium">₹ {(total / 100).toLocaleString("en-IN")}</span></span>
      <span className="shrink-0 pl-3 text-[15px] font-semibold">View cart</span>
    </Link>
  );
}
