"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MealPlan } from "@/lib/types";
import { savePlan, savePlanMenu } from "@/app/admin/actions";
import { Button } from "@/components/ui";
import { useAction } from "./Forms";
import { Check, inp, L } from "./ProductEditor";

const MEALS = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const LBL: Record<string, string> = { BREAKFAST: "Breakfast", LUNCH: "Lunch", DINNER: "Dinner", SNACK: "Snack" };

export function PlanEditor({ plan: p }: { plan: MealPlan | null }) {
  const router = useRouter();
  const { pending, run, note } = useAction();
  const price = (d: number) => p?.meal_plan_prices?.find((x) => x.duration_days === d);
  return (
    <form className="flex flex-col gap-5 rounded-[12px] border border-line bg-surface p-5" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(async () => { const r = await savePlan(p?.id ?? null, f); if (r.ok && !p && r.id) router.replace(`/admin/plans/${r.id}`); return r; }); }}>
      <div className="grid gap-4 md:grid-cols-3">
        <L label="Name"><input name="name" required defaultValue={p?.name} className={inp} /></L>
        <L label="Short label"><input name="label" defaultValue={p?.label} placeholder="Lunch + dinner" className={inp} /></L>
        <L label="Web address (slug)"><input name="slug" defaultValue={p?.slug} className={inp} /></L>
      </div>
      <L label="Description"><input name="description" defaultValue={p?.description} className={inp} /></L>
      <L label="Features (one per line)"><textarea name="features" rows={4} defaultValue={p?.features.join("\n")} className="rounded-[8px] border border-line-strong bg-raised p-3 text-sm font-normal" /></L>
      <fieldset className="grid gap-3 md:grid-cols-4"><legend className="mb-2 text-sm font-semibold">Meals and delivery slots</legend>
        {MEALS.map((m) => <div key={m} className="flex flex-col gap-2 rounded-[8px] bg-raised p-3"><Check name={`meal_${m}`} label={LBL[m]} defaultChecked={p?.meals.includes(m)} /><input aria-label={`${LBL[m]} delivery slot`} name={`slot_${m}`} defaultValue={p?.delivery_slots?.[m] ?? ""} placeholder="12:30–1:30 PM" className={inp} /></div>)}
      </fieldset>
      <fieldset className="flex flex-col gap-2"><legend className="mb-2 text-sm font-semibold">Prices (₹, including all meals; leave veg empty to hide a duration)</legend>
        {[7, 30, 90].map((d) => { const x = price(d); return (
          <div key={d} className="flex flex-wrap items-center gap-3"><span className="w-24 text-sm">{d === 7 ? "1 week" : d === 30 ? "1 month" : "3 months"}</span>
            <input aria-label="Veg price" name={`veg_${d}`} inputMode="decimal" defaultValue={x ? x.veg_price_paise / 100 : ""} placeholder="Veg" className={`${inp} w-32`} />
            <input aria-label="Non-veg price" name={`nonveg_${d}`} inputMode="decimal" defaultValue={x?.nonveg_price_paise != null ? x.nonveg_price_paise / 100 : ""} placeholder="Non-veg" className={`${inp} w-32`} />
            <Check name={`visible_${d}`} label="Visible" defaultChecked={x?.is_visible ?? true} /></div>); })}
      </fieldset>
      <div className="flex flex-wrap items-end gap-5">
        <L label="Skip cut-off (hours before the day)"><input name="skip_cutoff_hours" type="number" min={0} defaultValue={p?.skip_cutoff_hours ?? 3} className={`${inp} w-28`} /></L>
        <L label="Order"><input name="position" type="number" defaultValue={p?.position ?? 0} className={`${inp} w-20`} /></L>
        <Check name="nonveg_option" label="Offer non-veg" defaultChecked={p?.nonveg_option} />
        <Check name="allow_pause" label="Allow pause" defaultChecked={p?.allow_pause ?? true} />
        <Check name="highlight" label="Highlight (most popular)" defaultChecked={p?.highlight} />
        <Check name="show_on_home" label="Show on homepage" defaultChecked={p?.show_on_home ?? true} />
        <Check name="is_active" label="Active" defaultChecked={p?.is_active ?? true} />
      </div>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save plan"}</Button>{note}</div>
    </form>
  );
}

export function PlanMenuGrid({ planId, meals, week, menu, dishes }: { planId: string; meals: string[]; week: number; menu: { weekday: number; meal: string; product_id: string | null; custom_name: string | null }[]; dishes: { id: string; name: string }[] }) {
  const { pending, run, note } = useAction();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <form className="flex flex-col gap-4 rounded-[12px] border border-line bg-surface p-5" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(() => savePlanMenu(planId, week, f)); }}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Rotating menu</h2>
        <div className="flex gap-1">{[1, 2, 3, 4].map((w) => <Link key={w} href={`/admin/plans/${planId}?week=${w}`} className={`h-9 rounded-full border px-4 py-1.5 text-sm font-semibold ${w === week ? "border-brand bg-brand-soft" : "border-line"}`}>Week {w}</Link>)}</div></div>
      <p className="text-sm text-muted">Pick a dish marked “Can be used in meal plans”, or type a custom name (e.g. “Dal, sabzi, 2 phulka, rice”). The 4-week cycle repeats.</p>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-separate border-spacing-1.5 text-sm">
        <thead><tr><th />{days.map((d) => <th key={d} className="text-left font-semibold text-muted">{d}</th>)}</tr></thead>
        <tbody>{meals.map((m) => <tr key={m}><th className="pr-2 text-left">{LBL[m]}</th>{days.map((_, i) => {
          const c = menu.find((x) => x.weekday === i && x.meal === m);
          const val = c?.product_id ? `p:${c.product_id}` : c?.custom_name ? `t:${c.custom_name}` : "";
          return <td key={i}><CellInput name={`cell_${i}_${m}`} value={val} dishes={dishes} /></td>;
        })}</tr>)}</tbody>
      </table></div>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving…" : `Save week ${week}`}</Button>{note}</div>
    </form>
  );
}
function CellInput({ name, value, dishes }: { name: string; value: string; dishes: { id: string; name: string }[] }) {
  const listId = `${name}-list`;
  const display = value.startsWith("p:") ? dishes.find((d) => d.id === value.slice(2))?.name ?? "" : value.slice(2);
  return (
    <>
      <input aria-label={name} list={listId} defaultValue={display} className="h-10 w-full rounded-[8px] border border-line bg-raised px-2 text-sm"
        onChange={(e) => { const hidden = e.currentTarget.nextElementSibling?.nextElementSibling as HTMLInputElement; const d = dishes.find((x) => x.name === e.target.value); hidden.value = e.target.value ? (d ? `p:${d.id}` : `t:${e.target.value}`) : ""; }} />
      <datalist id={listId}>{dishes.map((d) => <option key={d.id} value={d.name} />)}</datalist>
      <input type="hidden" name={name} defaultValue={value} />
    </>
  );
}
