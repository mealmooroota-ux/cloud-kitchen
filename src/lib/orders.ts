import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeEta, getRoute } from "@/lib/eta";
import type { OrderStatus, Settings } from "@/lib/types";
import { log } from "@/lib/log";

/** Service-role transition (payments/system). Staff transitions call the same SQL function with their own JWT. */
export async function transition(db: SupabaseClient, orderId: string, to: OrderStatus, source: "payment" | "system" | "staff", note?: string) {
  const { data, error } = await db.rpc("transition_order", { p_order_id: orderId, p_to: to, p_source: source, p_note: note ?? null });
  if (error) {
    log("warn", "order.transition_rejected", { orderId, to, source, error: error.message });
    throw new Error(error.message);
  }
  return data;
}

/** Recalculate ETA on key events: order accepted (prep starts) and out for delivery (only travel remains). */
export async function recalcEta(db: SupabaseClient, orderId: string, phase: "created" | "confirmed" | "out_for_delivery", settings: Settings) {
  const { data: o } = await db.from("orders").select("id, latitude, longitude, prep_minutes, travel_seconds").eq("id", orderId).single();
  if (!o || o.latitude == null || o.longitude == null) return;
  const route = await getRoute({ lat: settings.kitchen_lat, lng: settings.kitchen_lng }, { lat: o.latitude, lng: o.longitude });
  const now = new Date();
  let update: Record<string, unknown>;
  if (phase === "out_for_delivery") {
    const delivery = route ? new Date(now.getTime() + route.durationSeconds * 1000 + settings.buffer_minutes * 60000) : null;
    update = { estimated_delivery_at: delivery?.toISOString() ?? null, eta_is_estimate: !route };
  } else {
    const eta = computeEta({ startAt: now, prepMinutes: o.prep_minutes ?? 20, packingMinutes: settings.packing_minutes, bufferMinutes: settings.buffer_minutes, route });
    update = { estimated_ready_at: eta.readyAt.toISOString(), estimated_delivery_at: eta.deliveryAt?.toISOString() ?? null, eta_is_estimate: eta.isEstimate };
  }
  if (route) Object.assign(update, { travel_seconds: route.durationSeconds, distance_m: route.distanceMeters });
  await db.from("orders").update(update).eq("id", orderId);
}
