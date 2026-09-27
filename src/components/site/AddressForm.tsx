"use client";
import { useState, useTransition } from "react";
import { saveAddress } from "@/app/account/actions";
import { Banner, Button, Field } from "@/components/ui";
import { haversineKm } from "@/lib/geo";
import { callAction } from "@/lib/call-action";

export function AddressForm({ kitchen, radiusKm, onSaved, initial }: {
  kitchen: { lat: number; lng: number }; radiusKm: number; onSaved?: (id: string) => void;
  initial?: Partial<{ id: string; label: string; line1: string; line2: string | null; landmark: string | null; city: string; postal_code: string; latitude: number; longitude: number; is_default: boolean }>;
}) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(initial?.latitude ? { lat: initial.latitude, lng: initial.longitude! } : null);
  const [err, setErr] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [pending, start] = useTransition();
  const km = coords ? haversineKm(kitchen, coords) : null;

  function locate() {
    if (!navigator.geolocation) return setErr("Your browser can’t share location. Try another browser.");
    setLocating(true); setErr(null);
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
      () => { setErr("Allow location access, or stand at the delivery address and try again."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => {
      e.preventDefault();
      if (!coords) return setErr("Set the location first so we can check delivery.");
      const f = new FormData(e.currentTarget);
      start(async () => {
        const r = await callAction(() => saveAddress({
          id: initial?.id ?? "", label: String(f.get("label")), line1: String(f.get("line1")), line2: String(f.get("line2") ?? ""), landmark: String(f.get("landmark") ?? ""),
          city: String(f.get("city")), postal_code: String(f.get("postal_code")), latitude: coords.lat, longitude: coords.lng, is_default: f.get("is_default") === "on",
        }));
        if (!r.ok) setErr(r.error ?? "Couldn’t save the address."); else onSaved?.("id" in r ? r.id! : "");
      });
    }}>
      {err && <Banner tone="danger" title={err} />}
      <div className="rounded-[12px] border border-line bg-raised p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-semibold">Delivery location</p>
            <p className="text-muted">{coords ? `Set · ${km!.toFixed(1)} km from our kitchen` : "Needed to check we deliver to you"}</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={locate} disabled={locating}>{locating ? "Locating…" : coords ? "Update location" : "Use my current location"}</Button>
        </div>
        {km != null && (km <= radiusKm
          ? <p className="mt-3 text-sm font-semibold text-success">Inside our delivery area</p>
          : <p className="mt-3 text-sm font-semibold text-danger">Outside our {radiusKm} km delivery area</p>)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="label" name="label" label="Save as" defaultValue={initial?.label ?? "Home"} required />
        <Field id="postal_code" name="postal_code" label="PIN code" inputMode="numeric" maxLength={6} defaultValue={initial?.postal_code} required />
      </div>
      <Field id="line1" name="line1" label="Flat, house, building" defaultValue={initial?.line1} required autoComplete="address-line1" />
      <Field id="line2" name="line2" label="Street and area" defaultValue={initial?.line2 ?? ""} autoComplete="address-line2" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="landmark" name="landmark" label="Landmark (optional)" defaultValue={initial?.landmark ?? ""} />
        <Field id="city" name="city" label="City" defaultValue={initial?.city ?? "Bengaluru"} required />
      </div>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="is_default" defaultChecked={initial?.is_default} className="size-5 accent-[var(--color-brand)]" />Make this my default address</label>
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : "Save address"}</Button>
    </form>
  );
}
