"use client";
import { useSyncExternalStore } from "react";

/** The cart only stores what the customer picked. Prices shown are always re-quoted by the server. */
export interface CartLine { key: string; productId: string; name: string; isVeg: boolean; unitPaise: number; addonIds: string[]; addonNames: string[]; quantity: number; imageId?: string | null }
const KEY = "ck.cart.v1";
let lines: CartLine[] = [];
const subs = new Set<() => void>();
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { lines = JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { lines = []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* private mode */ }
  subs.forEach((f) => f());
}
const EMPTY: CartLine[] = [];
export const cart = {
  subscribe(f: () => void) { load(); subs.add(f); return () => subs.delete(f); },
  get() { load(); return lines; },
  add(l: Omit<CartLine, "key" | "quantity">, qty = 1) {
    const key = l.productId + ":" + [...l.addonIds].sort().join(",");
    const ex = lines.find((x) => x.key === key);
    lines = ex ? lines.map((x) => (x.key === key ? { ...x, quantity: Math.min(20, x.quantity + qty) } : x)) : [...lines, { ...l, key, quantity: qty }];
    save();
  },
  setQty(key: string, q: number) { lines = q <= 0 ? lines.filter((x) => x.key !== key) : lines.map((x) => (x.key === key ? { ...x, quantity: Math.min(20, q) } : x)); save(); },
  clear() { lines = []; save(); },
};
export function useCart() {
  return useSyncExternalStore(cart.subscribe, cart.get, () => EMPTY);
}
export function toApiLines(ls: CartLine[]) {
  return ls.map((l) => ({ productId: l.productId, quantity: l.quantity, addonIds: l.addonIds }));
}
