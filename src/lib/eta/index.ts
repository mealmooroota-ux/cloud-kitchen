import "server-only";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

export interface Route { durationSeconds: number; distanceMeters: number }
type LatLng = { lat: number; lng: number };

async function googleRoute(o: LatLng, d: LatLng, key: string): Promise<Route | null> {
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "routes.duration,routes.distanceMeters" },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: o.lat, longitude: o.lng } } },
      destination: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
      travelMode: "TWO_WHEELER",
      routingPreference: "TRAFFIC_AWARE",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`google routes ${res.status}`);
  const j = await res.json();
  const r = j.routes?.[0];
  if (!r) return null;
  return { durationSeconds: parseInt(String(r.duration).replace("s", ""), 10), distanceMeters: r.distanceMeters };
}

async function orsRoute(o: LatLng, d: LatLng, key: string): Promise<Route | null> {
  const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: key },
    body: JSON.stringify({ coordinates: [[o.lng, o.lat], [d.lng, d.lat]] }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ors ${res.status}`);
  const j = await res.json();
  const s = j.routes?.[0]?.summary;
  if (!s) return null;
  return { durationSeconds: Math.round(s.duration), distanceMeters: Math.round(s.distance) };
}

/** Real road routing. Returns null when no provider is configured or the call fails (never guesses from distance/speed). */
export async function getRoute(origin: LatLng, dest: LatLng): Promise<Route | null> {
  const { provider, key } = env.maps;
  if (!provider || !key) return null;
  try {
    return provider === "google" ? await googleRoute(origin, dest, key) : await orsRoute(origin, dest, key);
  } catch (e) {
    log("warn", "eta.route_failed", { provider, error: String(e) });
    return null;
  }
}

export interface EtaInput { startAt: Date; prepMinutes: number; packingMinutes: number; bufferMinutes: number; route: Route | null }
export function computeEta(i: EtaInput) {
  const ready = new Date(i.startAt.getTime() + (i.prepMinutes + i.packingMinutes) * 60000);
  const delivery = i.route ? new Date(ready.getTime() + i.route.durationSeconds * 1000 + i.bufferMinutes * 60000) : null;
  return { readyAt: ready, deliveryAt: delivery, isEstimate: !i.route };
}
