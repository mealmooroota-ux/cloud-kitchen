import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Category, CookerLayer, MealPlan, Product } from "@/lib/types";

const PRODUCT_SELECT = "*, product_media(id, public_id, kind, alt, position), addon_groups(id, name, min_select, max_select, position, addons(id, name, price_paise, is_available, position))";

function sortProduct(p: Product): Product {
  p.product_media?.sort((a, b) => a.position - b.position);
  p.addon_groups?.sort((a, b) => a.position - b.position).forEach((g) => g.addons.sort((a, b) => a.position - b.position));
  return p;
}

export const getMenu = cache(async () => {
  if (!isSupabaseConfigured()) return { categories: [] as Category[], products: [] as Product[] };
  const db = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    db.from("categories").select("*").eq("is_active", true).order("position"),
    db.from("products").select(PRODUCT_SELECT).eq("is_active", true).order("position"),
  ]);
  return { categories: (categories ?? []) as Category[], products: ((products ?? []) as Product[]).map(sortProduct) };
});

export const getProduct = cache(async (slug: string) => {
  if (!isSupabaseConfigured()) return null;
  const db = await createClient();
  const { data } = await db.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("is_active", true).maybeSingle();
  return data ? sortProduct(data as Product) : null;
});

export const getPlans = cache(async () => {
  if (!isSupabaseConfigured()) return [] as MealPlan[];
  const db = await createClient();
  const { data } = await db.from("meal_plans").select("*, meal_plan_prices(*)").eq("is_active", true).order("position");
  return ((data ?? []) as MealPlan[]).map((p) => ({ ...p, meal_plan_prices: (p.meal_plan_prices ?? []).filter((x) => x.is_visible).sort((a, b) => a.duration_days - b.duration_days) }));
});

export type Sections = Record<string, { enabled: boolean; position: number; content: Record<string, unknown> }>;
export const getHome = cache(async () => {
  if (!isSupabaseConfigured()) return { sections: {} as Sections, layers: [] as CookerLayer[] };
  const db = await createClient();
  const [{ data: s }, { data: l }] = await Promise.all([
    db.from("site_sections").select("*").order("position"),
    db.from("cooker_layers").select("*").order("position"),
  ]);
  const sections: Sections = {};
  for (const r of s ?? []) sections[r.key] = { enabled: r.is_enabled, position: r.position, content: r.content ?? {} };
  return { sections, layers: (l ?? []) as CookerLayer[] };
});
