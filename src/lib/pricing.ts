import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Settings } from "@/lib/types";

export const CartLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  addonIds: z.array(z.string().uuid()).max(20).default([]),
});
export type CartLineInput = z.infer<typeof CartLineSchema>;

export class PricingError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export interface PricedItem {
  product_id: string; product_name: string; is_veg: boolean; unit_price_paise: number; quantity: number;
  addons: { name: string; price_paise: number }[]; line_total_paise: number; prep_minutes: number;
}
export interface Quote {
  items: PricedItem[]; subtotal_paise: number; discount_paise: number; delivery_fee_paise: number; tax_paise: number; total_paise: number;
  coupon_code: string | null; prep_minutes: number;
}

/** Authoritative price calculation. Never trusts client-side prices. `db` must be a service-role client. */
export async function priceCart(db: SupabaseClient, lines: CartLineInput[], settings: Settings, couponCode?: string | null): Promise<Quote> {
  if (lines.length === 0) throw new PricingError("EMPTY_CART", "Your cart is empty.");
  const ids = [...new Set(lines.map((l) => l.productId))];
  const { data: products, error } = await db
    .from("products")
    .select("id, name, price_paise, is_veg, is_available, is_active, prep_minutes, addon_groups(id, name, min_select, max_select, addons(id, name, price_paise, is_available))")
    .in("id", ids);
  if (error) throw new PricingError("DB", "Could not load the menu. Try again.");
  const byId = new Map((products ?? []).map((p) => [p.id as string, p]));

  const items: PricedItem[] = [];
  for (const line of lines) {
    const p = byId.get(line.productId);
    if (!p || !p.is_active) throw new PricingError("NOT_FOUND", "A dish in your cart is no longer on the menu.");
    if (!p.is_available) throw new PricingError("UNAVAILABLE", `${p.name} is sold out right now.`);
    const groups = (p.addon_groups ?? []) as { id: string; name: string; min_select: number; max_select: number; addons: { id: string; name: string; price_paise: number; is_available: boolean }[] }[];
    const chosen: { name: string; price_paise: number }[] = [];
    const selected = new Set(line.addonIds);
    for (const g of groups) {
      const picks = g.addons.filter((a) => selected.has(a.id));
      if (picks.length < g.min_select || picks.length > g.max_select) throw new PricingError("ADDONS", `Check your choices for ${p.name}: ${g.name}.`);
      for (const a of picks) {
        if (!a.is_available) throw new PricingError("ADDON_UNAVAILABLE", `${a.name} is unavailable right now.`);
        chosen.push({ name: a.name, price_paise: a.price_paise });
        selected.delete(a.id);
      }
    }
    if (selected.size > 0) throw new PricingError("ADDONS", `An add-on does not belong to ${p.name}.`);
    const unit = (p.price_paise as number) + chosen.reduce((s, a) => s + a.price_paise, 0);
    items.push({
      product_id: p.id as string, product_name: p.name as string, is_veg: p.is_veg as boolean, unit_price_paise: p.price_paise as number,
      quantity: line.quantity, addons: chosen, line_total_paise: unit * line.quantity, prep_minutes: p.prep_minutes as number,
    });
  }
  const subtotal = items.reduce((s, i) => s + i.line_total_paise, 0);
  if (subtotal < settings.min_order_paise) throw new PricingError("MIN_ORDER", "Your order is below the minimum order value.");

  let discount = 0;
  let coupon: string | null = null;
  if (couponCode) {
    const code = couponCode.trim().toUpperCase();
    const { data: c } = await db.from("coupons").select("*").eq("code", code).maybeSingle();
    const now = Date.now();
    const valid = c && c.is_active && (!c.starts_at || new Date(c.starts_at).getTime() <= now) && (!c.ends_at || new Date(c.ends_at).getTime() >= now)
      && (c.usage_limit == null || c.used_count < c.usage_limit) && subtotal >= c.min_subtotal_paise;
    if (!valid) throw new PricingError("COUPON", "This coupon can’t be used on this order.");
    discount = c.kind === "PERCENT" ? Math.floor((subtotal * c.value) / 100) : c.value;
    if (c.max_discount_paise != null) discount = Math.min(discount, c.max_discount_paise);
    discount = Math.min(discount, subtotal);
    coupon = code;
  }
  const afterDiscount = subtotal - discount;
  const delivery = settings.free_delivery_above_paise != null && afterDiscount >= settings.free_delivery_above_paise ? 0 : settings.delivery_fee_paise;
  const tax = Math.round((afterDiscount * settings.tax_rate_bps) / 10000);
  // Kitchens cook in parallel: the slowest dish sets the pace, +2 min per extra dish beyond three.
  const prep = Math.max(...items.map((i) => i.prep_minutes)) + Math.max(0, items.reduce((s, i) => s + i.quantity, 0) - 3) * 2;
  return { items, subtotal_paise: subtotal, discount_paise: discount, delivery_fee_paise: delivery, tax_paise: tax, total_paise: afterDiscount + delivery + tax, coupon_code: coupon, prep_minutes: prep };
}
