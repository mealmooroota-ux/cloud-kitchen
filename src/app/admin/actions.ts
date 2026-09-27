"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalcEta } from "@/lib/orders";
import { applyPaymentResult } from "@/lib/payments/service";
import { getSettings } from "@/lib/settings";
import { slugify } from "@/lib/format";
import { log } from "@/lib/log";
import type { OrderStatus } from "@/lib/types";
import { env } from "@/lib/env";

/** Returned instead of crashing when the server key is missing in Vercel. */
const NO_KEY = { ok: false as const, error: "The server key isn’t set. Add SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables, then redeploy." };

type R = { ok: true } | { ok: false; error: string };
const paise = (v: FormDataEntryValue | null) => Math.round(Number(String(v ?? "0").replace(/[^\d.]/g, "")) * 100);
const num = (v: FormDataEntryValue | null) => (v === null || String(v).trim() === "" ? null : Number(v));
const bool = (v: FormDataEntryValue | null) => v === "on" || v === "true";
const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();

// ---------- orders ----------
export async function transitionOrder(orderId: string, to: OrderStatus, note?: string): Promise<R> {
  const { supabase, user, role } = await requireStaff();
  if (!env.supabaseServiceKey) return NO_KEY;
  // Runs with the staff member's JWT: the SQL function enforces allowed transitions and role rules.
  const { error } = await supabase.rpc("transition_order", { p_order_id: orderId, p_to: to, p_source: "staff", p_note: note ?? null });
  if (error) return { ok: false, error: error.message.includes("INVALID_TRANSITION") ? "That step isn’t allowed from the current status." : error.message.includes("FORBIDDEN") ? "Your role can’t do that." : "Couldn’t update the order." };
  const db = createAdminClient();
  const settings = await getSettings();
  if (to === "CONFIRMED") await recalcEta(db, orderId, "confirmed", settings);
  if (to === "OUT_FOR_DELIVERY") { await recalcEta(db, orderId, "out_for_delivery", settings); await db.from("delivery").upsert({ order_id: orderId, picked_up_at: new Date().toISOString() }); }
  if (to === "DELIVERED") await db.from("delivery").upsert({ order_id: orderId, delivered_at: new Date().toISOString() });
  log("info", "order.staff_transition", { orderId, to, by: user.id, role });
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
export async function assignRider(orderId: string, formData: FormData): Promise<R> {
  await requireStaff(["ADMIN", "KITCHEN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  await createAdminClient().from("delivery").upsert({ order_id: orderId, rider_name: text(formData.get("rider_name")), rider_phone: text(formData.get("rider_phone")), assigned_at: new Date().toISOString() });
  revalidatePath(`/admin/orders/${orderId}`); revalidatePath("/admin/delivery");
  return { ok: true };
}

// ---------- payments ----------
/** Manual UPI only: an ADMIN confirms the credit is in the bank/PhonePe Business app. UTR is mandatory and logged. */
export async function confirmManualPayment(paymentId: string, formData: FormData): Promise<R> {
  const { user } = await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const utr = text(formData.get("utr")).toUpperCase();
  const amount = paise(formData.get("amount"));
  if (!/^[A-Z0-9]{8,22}$/.test(utr)) return { ok: false, error: "Enter the UPI transaction ID / UTR from your bank app." };
  const db = createAdminClient();
  const { data: p } = await db.from("payments").select("id, provider, amount_paise, status").eq("id", paymentId).single();
  if (!p || p.provider !== "manual_upi") return { ok: false, error: "Only manual UPI payments are confirmed here." };
  const { count } = await db.from("payments").select("id", { count: "exact", head: true }).eq("transaction_reference", utr);
  if ((count ?? 0) > 0) return { ok: false, error: "That UTR is already used on another order." };
  await db.from("payment_events").insert({ payment_id: p.id, provider: "manual_upi", event_type: "staff_confirmed", signature_valid: true, processed: true, payload: { utr, amount_paise: amount, by: user.id } });
  const r = await applyPaymentResult(db, p.id, { status: "PAID", amountPaise: amount, transactionReference: utr }, await getSettings(), { source: "staff_verified", verifiedBy: user.id });
  revalidatePath("/admin/payments"); revalidatePath("/admin/orders");
  if (!r.ok) return { ok: false, error: "The amount doesn’t match the order total. The payment is flagged for review." };
  return { ok: true };
}
export async function markPaymentFailed(paymentId: string): Promise<R> {
  const { user } = await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const db = createAdminClient();
  await db.from("payment_events").insert({ payment_id: paymentId, provider: "manual_upi", event_type: "staff_marked_failed", signature_valid: true, processed: true, payload: { by: user.id } });
  await applyPaymentResult(db, paymentId, { status: "FAILED" }, await getSettings(), { source: "staff" });
  revalidatePath("/admin/payments");
  return { ok: true };
}

// ---------- menu ----------
export async function setAvailability(productId: string, available: boolean): Promise<R> {
  await requireStaff(["ADMIN", "KITCHEN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  await createAdminClient().from("products").update({ is_available: available }).eq("id", productId);
  revalidatePath("/admin/products"); revalidatePath("/menu"); revalidatePath("/");
  return { ok: true };
}
const Addons = z.array(z.object({ id: z.string().optional(), name: z.string().min(1), min_select: z.number().int().min(0), max_select: z.number().int().min(1),
  addons: z.array(z.object({ id: z.string().optional(), name: z.string().min(1), price_paise: z.number().int().min(0), is_available: z.boolean() })) }));
export async function saveProduct(id: string | null, formData: FormData): Promise<R & { id?: string }> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const db = createAdminClient();
  const name = text(formData.get("name"));
  if (!name) return { ok: false, error: "Give the dish a name." };
  const row = {
    name, slug: slugify(text(formData.get("slug")) || name), description: text(formData.get("description")), price_paise: paise(formData.get("price")),
    category_id: text(formData.get("category_id")) || null, is_veg: bool(formData.get("is_veg")), prep_minutes: Number(formData.get("prep_minutes") || 20),
    serves: text(formData.get("serves")) || null, calories: num(formData.get("calories")), protein_g: num(formData.get("protein_g")),
    tags: text(formData.get("tags")).split(",").map((t) => t.trim()).filter(Boolean), is_available: bool(formData.get("is_available")), is_active: bool(formData.get("is_active")),
    show_on_home: bool(formData.get("show_on_home")), in_plan_rotation: bool(formData.get("in_plan_rotation")), daily_limit: num(formData.get("daily_limit")), position: Number(formData.get("position") || 0),
  };
  const res = id ? await db.from("products").update(row).eq("id", id).select("id").single() : await db.from("products").insert(row).select("id").single();
  if (res.error) return { ok: false, error: res.error.code === "23505" ? "Another dish already uses that web address (slug)." : "Couldn’t save the dish." };
  const pid = res.data.id as string;
  const parsed = Addons.safeParse(JSON.parse(String(formData.get("addon_groups") || "[]")));
  if (!parsed.success) return { ok: false, error: "Check the add-on groups." };
  await db.from("addon_groups").delete().eq("product_id", pid);
  for (const [gi, g] of parsed.data.entries()) {
    const { data: grp } = await db.from("addon_groups").insert({ product_id: pid, name: g.name, min_select: g.min_select, max_select: Math.max(g.max_select, g.min_select, 1), position: gi }).select("id").single();
    if (grp && g.addons.length) await db.from("addons").insert(g.addons.map((a, ai) => ({ group_id: grp.id, name: a.name, price_paise: a.price_paise, is_available: a.is_available, position: ai })));
  }
  revalidatePath("/admin/products"); revalidatePath("/menu"); revalidatePath("/");
  return { ok: true, id: pid };
}
export async function addMedia(productId: string, publicId: string, kind: "image" | "video", alt: string): Promise<R> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const db = createAdminClient();
  const { count } = await db.from("product_media").select("id", { count: "exact", head: true }).eq("product_id", productId);
  await db.from("product_media").insert({ product_id: productId, public_id: publicId, kind, alt, position: count ?? 0 });
  revalidatePath(`/admin/products/${productId}`); revalidatePath("/menu");
  return { ok: true };
}
export async function removeMedia(mediaId: string, productId: string): Promise<R> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  await createAdminClient().from("product_media").delete().eq("id", mediaId);
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}
export async function makeCover(mediaId: string, productId: string): Promise<R> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const db = createAdminClient();
  await db.from("product_media").update({ position: 1000 }).eq("product_id", productId).neq("id", mediaId);
  await db.from("product_media").update({ position: 0 }).eq("id", mediaId);
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}
export async function saveCategory(formData: FormData): Promise<R> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const id = text(formData.get("id"));
  const name = text(formData.get("name"));
  if (!name) return { ok: false, error: "Name the category." };
  const row = { name, slug: slugify(text(formData.get("slug")) || name), position: Number(formData.get("position") || 0), is_active: bool(formData.get("is_active")) };
  const db = createAdminClient();
  const { error } = id ? await db.from("categories").update(row).eq("id", id) : await db.from("categories").insert(row);
  if (error) return { ok: false, error: "Couldn’t save the category." };
  revalidatePath("/admin/categories"); revalidatePath("/menu");
  return { ok: true };
}
export async function deleteCategory(id: string): Promise<R> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  await createAdminClient().from("categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
  return { ok: true };
}

// ---------- meal plans ----------
export async function savePlan(id: string | null, formData: FormData): Promise<R & { id?: string }> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const name = text(formData.get("name"));
  if (!name) return { ok: false, error: "Name the plan." };
  const meals = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"].filter((m) => bool(formData.get(`meal_${m}`)));
  if (!meals.length) return { ok: false, error: "Pick at least one meal." };
  const row = {
    name, slug: slugify(text(formData.get("slug")) || name), label: text(formData.get("label")), description: text(formData.get("description")), meals,
    features: text(formData.get("features")).split("\n").map((s) => s.trim()).filter(Boolean), veg_option: true, nonveg_option: bool(formData.get("nonveg_option")),
    delivery_slots: Object.fromEntries(meals.map((m) => [m, text(formData.get(`slot_${m}`))])), skip_cutoff_hours: Number(formData.get("skip_cutoff_hours") || 3),
    allow_pause: bool(formData.get("allow_pause")), highlight: bool(formData.get("highlight")), show_on_home: bool(formData.get("show_on_home")), is_active: bool(formData.get("is_active")),
    position: Number(formData.get("position") || 0),
  };
  const db = createAdminClient();
  const res = id ? await db.from("meal_plans").update(row).eq("id", id).select("id").single() : await db.from("meal_plans").insert(row).select("id").single();
  if (res.error) return { ok: false, error: "Couldn’t save the plan." };
  const pid = res.data.id as string;
  for (const d of [7, 30, 90]) {
    const veg = text(formData.get(`veg_${d}`));
    if (!veg) { await db.from("meal_plan_prices").delete().eq("plan_id", pid).eq("duration_days", d); continue; }
    const nonveg = text(formData.get(`nonveg_${d}`));
    await db.from("meal_plan_prices").upsert({ plan_id: pid, duration_days: d, label: d === 7 ? "1 week" : d === 30 ? "1 month" : "3 months", veg_price_paise: paise(veg), nonveg_price_paise: nonveg ? paise(nonveg) : null, is_visible: bool(formData.get(`visible_${d}`)) }, { onConflict: "plan_id,duration_days" });
  }
  revalidatePath("/admin/plans"); revalidatePath("/plans"); revalidatePath("/");
  return { ok: true, id: pid };
}
export async function savePlanMenu(planId: string, week: number, formData: FormData): Promise<R> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const db = createAdminClient();
  const rows: { plan_id: string; week: number; weekday: number; meal: string; product_id: string | null; custom_name: string | null }[] = [];
  for (const [k, v] of formData.entries()) {
    const m = /^cell_(\d)_(BREAKFAST|LUNCH|DINNER|SNACK)$/.exec(k);
    if (!m) continue;
    const val = String(v);
    rows.push({ plan_id: planId, week, weekday: Number(m[1]), meal: m[2], product_id: val.startsWith("p:") ? val.slice(2) : null, custom_name: val.startsWith("t:") ? val.slice(2) : null });
  }
  await db.from("plan_menu").delete().eq("plan_id", planId).eq("week", week);
  const keep = rows.filter((r) => r.product_id || r.custom_name);
  if (keep.length) await db.from("plan_menu").insert(keep);
  revalidatePath(`/admin/plans/${planId}`); revalidatePath("/plans");
  return { ok: true };
}

// ---------- site content ----------
export async function saveSection(key: string, content: Record<string, unknown>, enabled: boolean, position: number): Promise<R> {
  const { user } = await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const { error } = await createAdminClient().from("site_sections").upsert({ key, content, is_enabled: enabled, position, updated_at: new Date().toISOString(), updated_by: user.id });
  if (error) return { ok: false, error: "Couldn’t save the section." };
  revalidatePath("/"); revalidatePath("/admin/content");
  return { ok: true };
}
export async function saveLayers(formData: FormData): Promise<R> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const db = createAdminClient();
  for (const key of ["vent", "lid", "rice", "pot", "plate", "base"]) {
    await db.from("cooker_layers").upsert({ key, position: ["vent", "lid", "rice", "pot", "plate", "base"].indexOf(key) + 1, name: text(formData.get(`${key}_name`)), title: text(formData.get(`${key}_title`)), body: text(formData.get(`${key}_body`)) });
  }
  revalidatePath("/");
  return { ok: true };
}
export async function saveSettings(formData: FormData): Promise<R> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const row = {
    kitchen_name: text(formData.get("kitchen_name")), kitchen_address: text(formData.get("kitchen_address")) || null,
    kitchen_lat: Number(formData.get("kitchen_lat")), kitchen_lng: Number(formData.get("kitchen_lng")), delivery_radius_km: Number(formData.get("delivery_radius_km")),
    delivery_fee_paise: paise(formData.get("delivery_fee")), free_delivery_above_paise: text(formData.get("free_delivery_above")) ? paise(formData.get("free_delivery_above")) : null,
    tax_rate_bps: Math.round(Number(formData.get("tax_rate")) * 100), packing_minutes: Number(formData.get("packing_minutes")), buffer_minutes: Number(formData.get("buffer_minutes")),
    min_order_paise: paise(formData.get("min_order")), is_open: bool(formData.get("is_open")), open_time: text(formData.get("open_time")), close_time: text(formData.get("close_time")),
    auto_confirm_paid_orders: bool(formData.get("auto_confirm_paid_orders")), support_phone: text(formData.get("support_phone")) || null,
    support_email: text(formData.get("support_email")) || null, fssai_license: text(formData.get("fssai_license")) || null,
  };
  if (!Number.isFinite(row.kitchen_lat) || !Number.isFinite(row.kitchen_lng)) return { ok: false, error: "Set the kitchen location." };
  const { error } = await createAdminClient().from("settings").update(row).eq("id", 1);
  if (error) return { ok: false, error: "Couldn’t save settings." };
  revalidatePath("/", "layout");
  return { ok: true };
}
export async function setKitchenOpen(open: boolean): Promise<R> {
  await requireStaff(["ADMIN", "KITCHEN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  await createAdminClient().from("settings").update({ is_open: open }).eq("id", 1);
  revalidatePath("/", "layout");
  return { ok: true };
}
export async function saveCoupon(formData: FormData): Promise<R> {
  await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  const code = text(formData.get("code")).toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(code)) return { ok: false, error: "Use 3–20 letters or numbers." };
  const kind = text(formData.get("kind")) === "FLAT" ? "FLAT" : "PERCENT";
  const value = kind === "FLAT" ? paise(formData.get("value")) : Number(formData.get("value"));
  const { error } = await createAdminClient().from("coupons").upsert({ code, kind, value, min_subtotal_paise: paise(formData.get("min_subtotal")), max_discount_paise: text(formData.get("max_discount")) ? paise(formData.get("max_discount")) : null, usage_limit: num(formData.get("usage_limit")), is_active: bool(formData.get("is_active")) });
  if (error) return { ok: false, error: "Couldn’t save the coupon." };
  revalidatePath("/admin/settings");
  return { ok: true };
}

// ---------- people ----------
export async function setRole(userId: string, role: "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY"): Promise<R> {
  const { user } = await requireStaff(["ADMIN"]);
  if (!env.supabaseServiceKey) return NO_KEY;
  if (userId === user.id && role !== "ADMIN") return { ok: false, error: "You can’t remove your own admin access." };
  await createAdminClient().from("profiles").update({ role }).eq("id", userId);
  log("info", "admin.role_changed", { userId, role, by: user.id });
  revalidatePath("/admin/customers");
  return { ok: true };
}
