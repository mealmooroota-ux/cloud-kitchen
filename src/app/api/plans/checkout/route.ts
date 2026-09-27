import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";
import { haversineKm } from "@/lib/geo";
import { startPayment } from "@/lib/payments/service";
import { rateLimit } from "@/lib/rate-limit";
import { json, fail, sameOrigin } from "@/lib/api";
import { normalizeIndianMobile } from "@/lib/phone";

const Body = z.object({
  planId: z.string().uuid(), priceId: z.string().uuid(), diet: z.enum(["VEG", "NONVEG"]),
  preferences: z.array(z.string().max(40)).max(8).default([]), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), addressId: z.string().uuid(),
  contactPhone: z.string().max(20),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("FORBIDDEN", "Bad origin.", 403);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("AUTH", "Please verify your phone number first.", 401);
  if (!(await rateLimit(`plan:${auth.user.id}`, 5, 600))) return fail("RATE", "Too many attempts. Wait a few minutes.", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("INVALID", "Check your plan details.");
  const b = parsed.data;
  const contactPhone = normalizeIndianMobile(b.contactPhone);
  if (!contactPhone) return fail("PHONE", "Enter a valid 10-digit mobile number for deliveries.");

  const db = createAdminClient();
  const settings = await getSettings();
  const { data: plan } = await db.from("meal_plans").select("*").eq("id", b.planId).eq("is_active", true).maybeSingle();
  const { data: price } = await db.from("meal_plan_prices").select("*").eq("id", b.priceId).eq("plan_id", b.planId).eq("is_visible", true).maybeSingle();
  if (!plan || !price) return fail("PLAN", "This plan isn’t available.", 422);
  if (b.diet === "NONVEG" && (!plan.nonveg_option || price.nonveg_price_paise == null)) return fail("PLAN", "Non-veg isn’t offered on this plan.", 422);
  const todayIst = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  if (b.startDate <= todayIst) return fail("DATE", "Plans can start from tomorrow.", 422);

  const { data: addr } = await supabase.from("addresses").select("*").eq("id", b.addressId).maybeSingle();
  if (!addr) return fail("ADDRESS", "Choose a delivery address.", 422);
  if (haversineKm({ lat: settings.kitchen_lat, lng: settings.kitchen_lng }, { lat: addr.latitude, lng: addr.longitude }) > Number(settings.delivery_radius_km))
    return fail("OUT_OF_ZONE", "This address is outside our delivery area.", 422);

  const base = b.diet === "VEG" ? price.veg_price_paise : price.nonveg_price_paise!;
  const tax = Math.round((base * settings.tax_rate_bps) / 10000);
  const addrSnap = { label: addr.label, line1: addr.line1, line2: addr.line2, landmark: addr.landmark, city: addr.city, postal_code: addr.postal_code };
  const { data: order, error } = await db.from("orders").insert({
    user_id: auth.user.id, kind: "PLAN", subtotal_paise: base, delivery_fee_paise: 0, tax_paise: tax, total_paise: base + tax,
    address_id: addr.id, delivery_address: addrSnap, latitude: addr.latitude, longitude: addr.longitude, contact_phone: contactPhone,
  }).select("id").single();
  await db.from("profiles").update({ phone: contactPhone }).eq("id", auth.user.id);
  if (error || !order) return fail("SERVER", "Couldn’t create your plan. Try again.", 500);
  await db.from("order_items").insert({ order_id: order.id, product_name: `${plan.name} · ${price.label} · ${b.diet === "VEG" ? "Veg" : "Non-veg"}`, is_veg: b.diet === "VEG", unit_price_paise: base, quantity: 1, line_total_paise: base, meta: { plan_id: plan.id, price_id: price.id } });
  const start = new Date(b.startDate + "T00:00:00Z");
  const end = new Date(start.getTime() + (price.duration_days - 1) * 86400000);
  await db.from("subscriptions").insert({
    user_id: auth.user.id, plan_id: plan.id, price_id: price.id, order_id: order.id, diet: b.diet, preferences: b.preferences, meals: plan.meals,
    slots: plan.delivery_slots, address_id: addr.id, delivery_address: addrSnap, start_date: b.startDate, end_date: end.toISOString().slice(0, 10),
  });
  try {
    await startPayment(db, order.id);
  } catch {
    return fail("PAY", "Plan saved, but the payment couldn’t start. Open it from your orders to retry.", 500);
  }
  return json({ orderId: order.id });
}
