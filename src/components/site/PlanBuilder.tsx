"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Address, MealPlan } from "@/lib/types";
import { Banner, Button, LinkButton } from "@/components/ui";
import { AddressForm } from "./AddressForm";
import { rupees } from "@/lib/format";

const PREFS = ["No onion & garlic", "Less spicy", "No dairy", "Jain"];
const MEAL_LABEL: Record<string, string> = { BREAKFAST: "Breakfast", LUNCH: "Lunch", DINNER: "Dinner", SNACK: "Snack" };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PlanBuilder({ plans, initialSlug, addresses, signedIn, kitchen, radiusKm, taxBps, weekMenu }: {
  plans: MealPlan[]; initialSlug?: string; addresses: Address[]; signedIn: boolean; kitchen: { lat: number; lng: number }; radiusKm: number; taxBps: number;
  weekMenu: { weekday: number; meal: string; name: string }[];
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug ?? plans[0].slug);
  const plan = plans.find((p) => p.slug === slug)!;
  const prices = plan.meal_plan_prices ?? [];
  const [priceId, setPriceId] = useState<string | undefined>(prices.find((p) => p.duration_days >= 28)?.id ?? prices[0]?.id);
  const price = prices.find((p) => p.id === priceId) ?? prices[0];
  const [diet, setDiet] = useState<"VEG" | "NONVEG">("VEG");
  const [prefs, setPrefs] = useState<string[]>([]);
  const tomorrow = useMemo(() => new Date(Date.now() + 5.5 * 3600e3 + 86400e3).toISOString().slice(0, 10), []);
  const [start, setStart] = useState(tomorrow);
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const base = price ? (diet === "VEG" ? price.veg_price_paise : price.nonveg_price_paise ?? price.veg_price_paise) : 0;
  const tax = Math.round((base * taxBps) / 10000);
  const meals = price ? price.duration_days * plan.meals.length : 0;

  const opt = (on: boolean) => `flex flex-1 cursor-pointer flex-col gap-1 rounded-[16px] p-4 text-left ${on ? "border-2 border-brand bg-brand-soft" : "border border-line bg-surface"}`;
  async function pay() {
    setBusy(true); setErr(null);
    const r = await fetch("/api/plans/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: plan.id, priceId: price.id, diet, preferences: prefs, startDate: start, addressId }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error?.message ?? "Couldn’t create your plan.");
    router.push(`/orders/${j.orderId}`);
  }
  return (
    <div className="grid gap-10 md:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-12">
        <header><p className="text-sm font-semibold text-saffron">Meal plans</p><h1 className="font-display text-[40px] leading-none md:text-[56px]">Build your meal plan</h1><p className="mt-3 text-[17px] text-muted">Home food delivered every day. Pause, skip or change meals from your account.</p></header>
        <Step n={1} t="Choose a plan"><div className="flex flex-col gap-3 sm:flex-row">{plans.map((p) => <button type="button" key={p.id} aria-pressed={p.slug === slug} className={opt(p.slug === slug)} onClick={() => { setSlug(p.slug); setPriceId(p.meal_plan_prices?.[0]?.id); if (!p.nonveg_option) setDiet("VEG"); }}><span className="font-semibold">{p.name}</span><span className="text-sm text-muted">{p.label}</span></button>)}</div></Step>
        <Step n={2} t="How long?"><div className="flex flex-col gap-3 sm:flex-row">{prices.map((p) => <button type="button" key={p.id} aria-pressed={p.id === price?.id} className={opt(p.id === price?.id)} onClick={() => setPriceId(p.id)}><span className="font-semibold">{p.label}</span><span className="tabular font-mono text-sm text-muted">{rupees(diet === "VEG" ? p.veg_price_paise : p.nonveg_price_paise ?? p.veg_price_paise)}</span></button>)}</div></Step>
        <Step n={3} t="Your food">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" aria-pressed={diet === "VEG"} className={opt(diet === "VEG")} onClick={() => setDiet("VEG")}><span className="font-semibold">Vegetarian</span><span className="text-sm text-muted">All meals veg</span></button>
            {plan.nonveg_option && <button type="button" aria-pressed={diet === "NONVEG"} className={opt(diet === "NONVEG")} onClick={() => setDiet("NONVEG")}><span className="font-semibold">Non-veg on some days</span><span className="text-sm text-muted">Chicken or egg on set days</span></button>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{PREFS.map((p) => { const on = prefs.includes(p); return <button key={p} type="button" aria-pressed={on} onClick={() => setPrefs((c) => (on ? c.filter((x) => x !== p) : [...c, p]))} className={`h-9 rounded-full border px-4 text-sm font-semibold ${on ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface"}`}>{p}</button>; })}</div>
        </Step>
        <Step n={4} t="When and where">
          <div className="grid gap-3 sm:grid-cols-3">{plan.meals.map((m) => <div key={m} className="rounded-[12px] bg-raised p-3 text-sm"><p className="font-semibold">{MEAL_LABEL[m]}</p><p className="text-muted">{plan.delivery_slots?.[m] ?? ""}</p></div>)}</div>
          <label className="mt-3 flex flex-col gap-2 text-sm font-semibold sm:w-60">Start date<input type="date" min={tomorrow} value={start} onChange={(e) => setStart(e.target.value)} className="h-12 rounded-[8px] border border-line-strong bg-raised px-3 font-normal" /></label>
          {signedIn ? (
            <div className="mt-3 flex flex-col gap-2">
              {addresses.map((a) => <label key={a.id} className={`flex cursor-pointer gap-3 rounded-[12px] border p-3 ${a.id === addressId ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}><input type="radio" checked={a.id === addressId} onChange={() => setAddressId(a.id)} className="mt-1 size-5 accent-[var(--color-brand)]" /><span className="text-sm"><b>{a.label}</b> · {a.line1}, {a.city}</span></label>)}
              {adding ? <div className="rounded-[20px] border border-line bg-surface p-5"><AddressForm kitchen={kitchen} radiusKm={radiusKm} onSaved={(id) => { setAddressId(id); setAdding(false); router.refresh(); }} /></div> : <button type="button" className="self-start text-sm font-semibold text-brand" onClick={() => setAdding(true)}>Add a new address</button>}
            </div>
          ) : <div className="mt-3"><LinkButton href={`/login?next=${encodeURIComponent(`/plans?plan=${slug}`)}`} variant="secondary">Sign in to choose your address</LinkButton></div>}
        </Step>
        {weekMenu.length > 0 && (
          <Step n={5} t="A week on this plan">
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] border-separate border-spacing-2 text-left text-sm">
              <thead><tr><th />{DAYS.map((d) => <th key={d} className="font-semibold text-muted">{d}</th>)}</tr></thead>
              <tbody>{plan.meals.map((m) => <tr key={m}><th className="pr-2 font-semibold">{MEAL_LABEL[m]}</th>{DAYS.map((_, i) => <td key={i} className="rounded-[10px] border border-line bg-surface p-2.5 align-top">{weekMenu.find((x) => x.weekday === i && x.meal === m)?.name ?? "Chef’s choice"}</td>)}</tr>)}</tbody>
            </table></div>
            <p className="mt-2 text-sm text-muted">The menu rotates daily, set by our kitchen.</p>
          </Step>
        )}
      </div>
      <aside className="h-fit rounded-[24px] border border-line bg-surface p-7 shadow-[0_8px_24px_rgba(31,27,22,.06)] md:sticky md:top-28">
        <p className="text-lg font-semibold">Your plan</p>
        <p className="mt-2 font-display text-[28px] leading-tight">{plan.name} · {price?.label}</p>
        <p className="text-sm text-muted">{diet === "VEG" ? "Veg" : "Non-veg"}{prefs.length ? ` · ${prefs.join(", ").toLowerCase()}` : ""} · starts {new Date(start).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
        <dl className="mt-5 flex flex-col gap-2 text-sm text-muted">
          <div className="flex justify-between"><dt>Meals</dt><dd className="tabular font-mono">{meals}</dd></div>
          <div className="flex justify-between"><dt>Plan price</dt><dd className="tabular font-mono">{rupees(base, { decimals: true })}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>Included</dd></div>
          <div className="flex justify-between"><dt>GST</dt><dd className="tabular font-mono">{rupees(tax, { decimals: true })}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink"><dt>Total</dt><dd className="tabular font-mono">{rupees(base + tax, { decimals: true })}</dd></div>
        </dl>
        {err && <div className="mt-4"><Banner tone="danger" title={err} /></div>}
        <Button size="lg" className="mt-5 w-full" disabled={busy || !signedIn || !addressId || !price} onClick={pay}>{busy ? "Starting…" : "Continue to pay"}</Button>
        <p className="mt-3 text-xs text-muted">Paid once, securely. Final amount is checked by our server. Skipped meals are credited to your plan.</p>
      </aside>
    </div>
  );
}
function Step({ n, t, children }: { n: number; t: string; children: React.ReactNode }) {
  return <section className="flex flex-col gap-4"><h2 className="flex items-baseline gap-3 font-display text-[26px]"><span className="tabular font-mono text-sm text-brand">{n}</span>{t}</h2>{children}</section>;
}
