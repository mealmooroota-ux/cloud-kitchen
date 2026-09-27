import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CartLineSchema, priceCart, PricingError } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { haversineKm } from "@/lib/geo";
import { computeEta, getRoute } from "@/lib/eta";
import { startPayment } from "@/lib/payments/service";
import { rateLimit } from "@/lib/rate-limit";
import { json, fail, sameOrigin } from "@/lib/api";
import { log } from "@/lib/log";

const Body = z.object({
  lines: z.array(CartLineSchema).min(1).max(30),
  addressId: z.string().uuid(),
  couponCode: z.string().max(40).optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});

function isOpen(open: string, close: string) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const m = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = open.split(":").map(Number); const [ch, cm] = close.split(":").map(Number);
  const o = oh * 60 + om, c = ch * 60 + cm;
  return o <= c ? m >= o && m < c : m >= o || m < c;
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("FORBIDDEN", "Bad origin.", 403);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("AUTH", "Please verify your phone number first.", 401);
  if (!(await rateLimit(`checkout:${auth.user.id}`, 8, 600))) return fail("RATE", "Too many attempts. Wait a few minutes and try again.", 429);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("INVALID", "Check your order details.");
  const { lines, addressId, couponCode, notes } = parsed.data;

  const settings = await getSettings();
  if (!settings.is_open || !isOpen(settings.open_time, settings.close_time)) return fail("CLOSED", "The kitchen is closed right now.", 422);

  const { data: addr } = await supabase.from("addresses").select("*").eq("id", addressId).maybeSingle();
  if (!addr) return fail("ADDRESS", "Choose a delivery address.", 422);
  const km = haversineKm({ lat: settings.kitchen_lat, lng: settings.kitchen_lng }, { lat: addr.latitude, lng: addr.longitude });
  if (km > Number(settings.delivery_radius_km)) return fail("OUT_OF_ZONE", `This address is outside our ${settings.delivery_radius_km} km delivery area.`, 422);

  const db = createAdminClient();
  try {
    const quote = await priceCart(db, lines, settings, couponCode);
    const route = await getRoute({ lat: settings.kitchen_lat, lng: settings.kitchen_lng }, { lat: addr.latitude, lng: addr.longitude });
    const eta = computeEta({ startAt: new Date(), prepMinutes: quote.prep_minutes, packingMinutes: settings.packing_minutes, bufferMinutes: settings.buffer_minutes, route });
    const { data: order, error } = await db.from("orders").insert({
      user_id: auth.user.id, kind: "ORDER", subtotal_paise: quote.subtotal_paise, delivery_fee_paise: quote.delivery_fee_paise,
      discount_paise: quote.discount_paise, tax_paise: quote.tax_paise, total_paise: quote.total_paise, coupon_code: quote.coupon_code,
      address_id: addr.id, delivery_address: { label: addr.label, line1: addr.line1, line2: addr.line2, landmark: addr.landmark, city: addr.city, postal_code: addr.postal_code },
      latitude: addr.latitude, longitude: addr.longitude, prep_minutes: quote.prep_minutes, notes: notes ?? null,
      distance_m: route?.distanceMeters ?? null, travel_seconds: route?.durationSeconds ?? null, eta_is_estimate: eta.isEstimate,
      estimated_ready_at: eta.readyAt.toISOString(), estimated_delivery_at: eta.deliveryAt?.toISOString() ?? null,
    }).select("id").single();
    if (error || !order) throw new Error(error?.message ?? "insert failed");
    const { error: iErr } = await db.from("order_items").insert(quote.items.map((i) => ({
      order_id: order.id, product_id: i.product_id, product_name: i.product_name, is_veg: i.is_veg, unit_price_paise: i.unit_price_paise,
      quantity: i.quantity, addons: i.addons, line_total_paise: i.line_total_paise,
    })));
    if (iErr) throw new Error(iErr.message);
    if (quote.coupon_code) await db.rpc("increment_coupon", { p_code: quote.coupon_code });
    await startPayment(db, order.id);
    log("info", "order.created", { orderId: order.id, total: quote.total_paise });
    return json({ orderId: order.id });
  } catch (e) {
    if (e instanceof PricingError) return fail(e.code, e.message, 422);
    log("error", "checkout.failed", { error: String(e) });
    return fail("SERVER", "We couldn’t place your order. You have not been charged. Try again.", 500);
  }
}
