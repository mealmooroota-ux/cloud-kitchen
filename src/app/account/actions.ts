"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const AddressSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  label: z.string().trim().min(1).max(30),
  line1: z.string().trim().min(3).max(160),
  line2: z.string().trim().max(160).optional(),
  landmark: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(60),
  postal_code: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  is_default: z.coerce.boolean().optional(),
});
export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function saveAddress(input: z.input<typeof AddressSchema>): Promise<ActionResult> {
  const parsed = AddressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the address." };
  if (!parsed.data.latitude && !parsed.data.longitude) return { ok: false, error: "Set the location on your address so we can check delivery." };
  const db = await createClient();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return { ok: false, error: "Sign in again." };
  const { id, ...row } = parsed.data;
  if (row.is_default) await db.from("addresses").update({ is_default: false }).eq("user_id", auth.user.id);
  const q = id ? db.from("addresses").update(row).eq("id", id).select("id").single() : db.from("addresses").insert({ ...row, user_id: auth.user.id }).select("id").single();
  const { data, error } = await q;
  if (error) return { ok: false, error: "Couldn’t save the address." };
  revalidatePath("/account"); revalidatePath("/checkout");
  return { ok: true, id: data.id };
}
export async function deleteAddress(id: string): Promise<ActionResult> {
  const db = await createClient();
  const { error } = await db.from("addresses").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn’t delete the address." };
  revalidatePath("/account");
  return { ok: true };
}
export async function makeDefaultAddress(id: string): Promise<ActionResult> {
  const db = await createClient();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return { ok: false, error: "Sign in again." };
  await db.from("addresses").update({ is_default: false }).eq("user_id", auth.user.id);
  await db.from("addresses").update({ is_default: true }).eq("id", id);
  revalidatePath("/account");
  return { ok: true };
}
export async function updateName(formData: FormData) {
  const name = String(formData.get("full_name") ?? "").trim().slice(0, 80);
  const db = await createClient();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return;
  await db.from("profiles").update({ full_name: name }).eq("id", auth.user.id);
  revalidatePath("/account");
}
export async function signOut() {
  const db = await createClient();
  await db.auth.signOut();
}

// ---------- meal plan self-service ----------
function istToday() { return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); }
async function ownSub(id: string) {
  const db = await createClient();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return null;
  const { data } = await db.from("subscriptions").select("*, meal_plans(skip_cutoff_hours, allow_pause)").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
  return data;
}
export async function skipMeal(subscriptionId: string, date: string, meal: string): Promise<ActionResult> {
  const sub = await ownSub(subscriptionId);
  if (!sub || sub.status !== "ACTIVE") return { ok: false, error: "This plan isn’t active." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !sub.meals.includes(meal)) return { ok: false, error: "Invalid meal." };
  const cutoffHours = (sub.meal_plans as { skip_cutoff_hours: number }).skip_cutoff_hours ?? 3;
  const cutoff = new Date(`${date}T00:00:00+05:30`).getTime() - cutoffHours * 3600 * 1000;
  if (Date.now() > cutoff || date < sub.start_date || date > sub.end_date) return { ok: false, error: "It’s too late to skip this meal." };
  const { error } = await createAdminClient().from("subscription_skips").insert({ subscription_id: sub.id, date, meal });
  if (error && error.code !== "23505") return { ok: false, error: "Couldn’t skip the meal." };
  revalidatePath("/account/plan");
  return { ok: true };
}
export async function unskipMeal(subscriptionId: string, date: string, meal: string): Promise<ActionResult> {
  const sub = await ownSub(subscriptionId);
  if (!sub) return { ok: false, error: "Not found." };
  if (date <= istToday()) return { ok: false, error: "It’s too late to change today." };
  await createAdminClient().from("subscription_skips").delete().eq("subscription_id", sub.id).eq("date", date).eq("meal", meal);
  revalidatePath("/account/plan");
  return { ok: true };
}
export async function setPaused(subscriptionId: string, paused: boolean): Promise<ActionResult> {
  const sub = await ownSub(subscriptionId);
  if (!sub || !(sub.meal_plans as { allow_pause: boolean }).allow_pause) return { ok: false, error: "Pausing isn’t available on this plan." };
  if (paused && sub.status !== "ACTIVE") return { ok: false, error: "Only active plans can be paused." };
  const admin = createAdminClient();
  if (paused) {
    await admin.from("subscriptions").update({ status: "PAUSED", paused_from: istToday() }).eq("id", sub.id);
  } else {
    if (sub.status !== "PAUSED" || !sub.paused_from) return { ok: false, error: "This plan isn’t paused." };
    // extend the plan by the number of paused days so no paid meals are lost
    const days = Math.max(0, Math.round((new Date(istToday()).getTime() - new Date(sub.paused_from).getTime()) / 86400000));
    const end = new Date(new Date(sub.end_date).getTime() + days * 86400000).toISOString().slice(0, 10);
    await admin.from("subscriptions").update({ status: "ACTIVE", paused_from: null, end_date: end }).eq("id", sub.id);
  }
  revalidatePath("/account/plan");
  return { ok: true };
}
