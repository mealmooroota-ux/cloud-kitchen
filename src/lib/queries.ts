import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient, PUBLIC_TAG } from "@/lib/supabase/public";
import { env, isSupabaseConfigured } from "@/lib/env";
import type { Category, CookerLayer, MealPlan, Product } from "@/lib/types";

// Public data is cached for 10 minutes and refreshed instantly whenever an admin saves a change.
// The cache key includes the Supabase URL, and nothing is cached when Supabase isn't configured,
// so a deploy made before the keys were set can never leave an empty menu behind.
const CACHE = { tags: [PUBLIC_TAG], revalidate: 600 };
const scope = () => env.supabaseUrl ?? "none";
function cachedPublic<A extends unknown[], R>(key: string, fallback: R, fn: (...a: A) => Promise<R>) {
  return (...a: A): Promise<R> => (isSupabaseConfigured() ? unstable_cache(fn, [key, scope()], CACHE)(...a) : Promise.resolve(fallback));
}
const PRODUCT_SELECT = "*, product_media(id, public_id, kind, alt, position), addon_groups(id, name, min_select, max_select, position, addons(id, name, price_paise, is_available, position))";

function sortProduct(p: Product): Product {
  p.product_media?.sort((a, b) => a.position - b.position);
  p.addon_groups?.sort((a, b) => a.position - b.position).forEach((g) => g.addons.sort((a, b) => a.position - b.position));
  return p;
}

export const getMenu = cachedPublic("menu-v1", { categories: [] as Category[], products: [] as Product[] }, async () => {
  const db = createPublicClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    db.from("categories").select("*").eq("is_active", true).order("position"),
    db.from("products").select(PRODUCT_SELECT).eq("is_active", true).order("position"),
  ]);
  return { categories: (categories ?? []) as Category[], products: ((products ?? []) as Product[]).map(sortProduct) };
});

export const getProduct = cachedPublic("product-v1", null, async (slug: string) => {
  const { data } = await createPublicClient().from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("is_active", true).maybeSingle();
  return data ? sortProduct(data as Product) : null;
});

export const getPlans = cachedPublic("plans-v1", [] as MealPlan[], async () => {
  const { data } = await createPublicClient().from("meal_plans").select("*, meal_plan_prices(*)").eq("is_active", true).order("position");
  return ((data ?? []) as MealPlan[]).map((p) => ({ ...p, meal_plan_prices: (p.meal_plan_prices ?? []).filter((x) => x.is_visible).sort((a, b) => a.duration_days - b.duration_days) }));
});

export const getPlanWeek = cachedPublic("plan-week-v1", [] as { weekday: number; meal: string; name: string }[], async (planId: string) => {
  const { data } = await createPublicClient().from("plan_menu").select("weekday, meal, custom_name, products(name)").eq("plan_id", planId).eq("week", 1);
  return (data ?? []).map((r) => ({ weekday: r.weekday as number, meal: r.meal as string, name: (r.custom_name as string | null) ?? (r.products as unknown as { name: string } | null)?.name ?? "" }));
});

export type Sections = Record<string, { enabled: boolean; position: number; content: Record<string, unknown> }>;
export const getHome = cachedPublic("home-v1", { sections: {} as Sections, layers: [] as CookerLayer[] }, async () => {
  const db = createPublicClient();
  const [{ data: s }, { data: l }] = await Promise.all([
    db.from("site_sections").select("*").order("position"),
    db.from("cooker_layers").select("*").order("position"),
  ]);
  const sections: Sections = {};
  for (const r of s ?? []) sections[r.key] = { enabled: r.is_enabled, position: r.position, content: r.content ?? {} };
  return { sections, layers: (l ?? []) as CookerLayer[] };
});
