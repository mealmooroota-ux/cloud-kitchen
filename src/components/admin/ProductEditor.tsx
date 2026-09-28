"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProduct } from "@/app/admin/actions";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui";
import { useAction } from "./Forms";

type G = { name: string; min_select: number; max_select: number; addons: { name: string; price_paise: number; is_available: boolean }[] };
export const inp = "h-11 w-full rounded-[8px] border border-line-strong bg-raised px-3 text-sm";
export function L({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`flex flex-col gap-1.5 text-sm font-semibold ${className}`}>{label}{children}</label>;
}
export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-5 accent-[var(--color-brand)]" />{label}</label>;
}

export function ProductEditor({ product: p, categories }: { product: Product | null; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const { pending, run, note } = useAction();
  const [groups, setGroups] = useState<G[]>(() => (p?.addon_groups ?? []).map((g) => ({ name: g.name, min_select: g.min_select, max_select: g.max_select, addons: g.addons.map((a) => ({ name: a.name, price_paise: a.price_paise, is_available: a.is_available })) })));
  const upd = (i: number, patch: Partial<G>) => setGroups((gs) => gs.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  return (
    <form className="flex flex-col gap-5 rounded-[12px] border border-line bg-surface p-5" onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      f.set("addon_groups", JSON.stringify(groups));
      run(async () => { const r = await saveProduct(p?.id ?? null, f); if (r.ok && !p && r.id) router.replace(`/admin/products/${r.id}`); return r; });
    }}>
      <div className="grid gap-4 md:grid-cols-2">
        <L label="Name"><input name="name" required defaultValue={p?.name} className={inp} /></L>
        <L label="Web address (slug)"><input name="slug" defaultValue={p?.slug} placeholder="auto from name" className={inp} /></L>
        <L label="Category"><select name="category_id" defaultValue={p?.category_id ?? ""} className={inp}><option value="">None</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></L>
        <L label="Price (₹)"><input name="price" required inputMode="decimal" defaultValue={p ? (p.price_paise / 100).toString() : ""} className={inp} /></L>
      </div>
      <L label="Description"><textarea name="description" rows={3} defaultValue={p?.description} className="rounded-[8px] border border-line-strong bg-raised p-3 text-sm font-normal" /></L>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <L label="Prep min"><input name="prep_minutes" type="number" min={1} defaultValue={p?.prep_minutes ?? 20} className={inp} /></L>
        <L label="Serves"><input name="serves" defaultValue={p?.serves ?? ""} className={inp} /></L>
        <L label="kcal"><input name="calories" type="number" defaultValue={p?.calories ?? ""} className={inp} /></L>
        <L label="Protein g"><input name="protein_g" type="number" step="0.1" defaultValue={p?.protein_g ?? ""} className={inp} /></L>
        <L label="Daily limit"><input name="daily_limit" type="number" defaultValue={p?.daily_limit ?? ""} className={inp} /></L>
        <L label="Order"><input name="position" type="number" defaultValue={p?.position ?? 0} className={inp} /></L>
      </div>
      <L label="Tags (comma separated, e.g. Healthy, Millet, High protein, Homestyle)"><input name="tags" defaultValue={p?.tags.join(", ")} className={inp} /></L>
      <div className="flex flex-wrap gap-5">
        <Check name="is_veg" label="Vegetarian" defaultChecked={p?.is_veg ?? true} />
        <Check name="is_available" label="Available now" defaultChecked={p?.is_available ?? true} />
        <Check name="is_active" label="Shown on menu" defaultChecked={p?.is_active ?? true} />
        <Check name="show_on_home" label="Homepage signature" defaultChecked={p?.show_on_home} />
        <Check name="in_plan_rotation" label="Can be used in meal plans" defaultChecked={p?.in_plan_rotation} />
      </div>
      <fieldset className="flex flex-col gap-3 rounded-[12px] border border-line p-4">
        <legend className="px-1 font-semibold">Add-ons and choices</legend>
        {groups.map((g, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-[8px] bg-raised p-3">
            <div className="flex flex-wrap gap-2">
              <input aria-label="Group name" value={g.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder="e.g. Choose a bread" className={`${inp} flex-1`} />
              <label className="flex items-center gap-1 text-xs">Min<input type="number" min={0} value={g.min_select} onChange={(e) => upd(i, { min_select: Number(e.target.value) })} className={`${inp} w-16`} /></label>
              <label className="flex items-center gap-1 text-xs">Max<input type="number" min={1} value={g.max_select} onChange={(e) => upd(i, { max_select: Number(e.target.value) })} className={`${inp} w-16`} /></label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setGroups((gs) => gs.filter((_, j) => j !== i))}>Remove</Button>
            </div>
            {g.addons.map((a, ai) => (
              <div key={ai} className="flex gap-2 pl-4">
                <input aria-label="Option name" value={a.name} onChange={(e) => upd(i, { addons: g.addons.map((x, k) => (k === ai ? { ...x, name: e.target.value } : x)) })} placeholder="Option" className={`${inp} flex-1`} />
                <input aria-label="Extra price in rupees" inputMode="decimal" value={a.price_paise / 100} onChange={(e) => upd(i, { addons: g.addons.map((x, k) => (k === ai ? { ...x, price_paise: Math.round(Number(e.target.value || 0) * 100) } : x)) })} className={`${inp} w-24`} />
                <button type="button" className="text-sm text-danger" onClick={() => upd(i, { addons: g.addons.filter((_, k) => k !== ai) })}>✕<span className="sr-only">Remove option</span></button>
              </div>
            ))}
            <button type="button" className="self-start pl-4 text-sm font-semibold text-brand" onClick={() => upd(i, { addons: [...g.addons, { name: "", price_paise: 0, is_available: true }] })}>Add option</button>
          </div>
        ))}
        <button type="button" className="self-start text-sm font-semibold text-brand" onClick={() => setGroups((gs) => [...gs, { name: "", min_select: 0, max_select: 1, addons: [] }])}>Add a choice group</button>
      </fieldset>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save dish"}</Button>{note}</div>
    </form>
  );
}
