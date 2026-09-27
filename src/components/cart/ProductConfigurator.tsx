"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AddonGroup } from "@/lib/types";
import { cart } from "./store";
import { Button } from "@/components/ui";
import { rupees } from "@/lib/format";

export function ProductConfigurator({ product, groups }: { product: { id: string; name: string; is_veg: boolean; price_paise: number; is_available: boolean; imageId: string | null }; groups: AddonGroup[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Record<string, string[]>>(() => Object.fromEntries(groups.map((g) => [g.id, []])));
  const [qty, setQty] = useState(1);
  const all = groups.flatMap((g) => g.addons);
  const ids = Object.values(picked).flat();
  const unit = product.price_paise + ids.reduce((s, id) => s + (all.find((a) => a.id === id)?.price_paise ?? 0), 0);
  const invalid = useMemo(() => groups.find((g) => (picked[g.id]?.length ?? 0) < g.min_select), [groups, picked]);

  function toggle(g: AddonGroup, id: string) {
    setPicked((cur) => {
      const list = cur[g.id] ?? [];
      if (g.max_select === 1) return { ...cur, [g.id]: list.includes(id) && g.min_select === 0 ? [] : [id] };
      return { ...cur, [g.id]: list.includes(id) ? list.filter((x) => x !== id) : list.length >= g.max_select ? list : [...list, id] };
    });
  }
  if (!product.is_available) return <p className="rounded-[12px] bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">Sold out right now. Check back later today.</p>;
  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <fieldset key={g.id} className="flex flex-col gap-2.5">
          <legend className="mb-2 text-base font-semibold">{g.name} <span className="font-normal text-muted">{g.min_select > 0 ? "· required" : "· optional"}{g.max_select > 1 ? ` · up to ${g.max_select}` : ""}</span></legend>
          {g.addons.filter((a) => a.is_available).map((a) => {
            const on = picked[g.id]?.includes(a.id);
            return (
              <label key={a.id} className={`flex h-[52px] cursor-pointer items-center gap-3 rounded-[12px] border px-4 ${on ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}>
                <input type={g.max_select === 1 ? "radio" : "checkbox"} name={g.id} checked={!!on} onChange={() => toggle(g, a.id)} className="size-5 accent-[var(--color-brand)]" />
                <span className="flex-1 text-[15px]">{a.name}</span>
                <span className="tabular font-mono text-sm text-muted">{a.price_paise ? `+ ${rupees(a.price_paise)}` : "Free"}</span>
              </label>
            );
          })}
        </fieldset>
      ))}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-line bg-surface px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 md:static md:border-0 md:bg-transparent md:p-0">
        <div className="flex h-14 items-center gap-1 rounded-full bg-brand-soft px-1.5">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center rounded-full text-xl text-brand">−</button>
          <span className="tabular w-6 text-center font-mono" aria-live="polite">{qty}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid size-11 place-items-center rounded-full text-xl text-brand">+</button>
        </div>
        <Button size="lg" className="flex-1" disabled={!!invalid} title={invalid ? `Choose ${invalid.name}` : undefined}
          onClick={() => {
            cart.add({ productId: product.id, name: product.name, isVeg: product.is_veg, unitPaise: unit, addonIds: ids, addonNames: ids.map((id) => all.find((a) => a.id === id)?.name ?? ""), imageId: product.imageId }, qty);
            router.push("/cart");
          }}>
          {invalid ? `Choose ${invalid.name.toLowerCase()}` : `Add to cart · ${rupees(unit * qty)}`}
        </Button>
      </div>
    </div>
  );
}
