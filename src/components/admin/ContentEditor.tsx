"use client";
import { useState } from "react";
import Image from "next/image";
import { saveLayers, saveSection } from "@/app/admin/actions";
import type { CookerLayer } from "@/lib/types";
import { Button } from "@/components/ui";
import { useAction } from "./Forms";
import { CloudinaryUpload } from "./CloudinaryUpload";
import { inp, L } from "./ProductEditor";

const TITLES: Record<string, string> = {
  hero: "Hero", marquee: "Dish ticker", cooker: "3D cooker story", homemade: "Our food", plate: "What’s on your plate", healthy: "Healthy & light",
  plans: "Meal plans", plans_how: "How meal plans work", signatures: "Signature dishes", how: "How ordering works", faq: "FAQ", closing: "Closing section",
  kitchen_page: "Our kitchen page",
};
const label = (k: string) => k.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase());
type Item = { title: string; body: string };

export function SectionEditor({ sectionKey, enabled: e0, position: p0, content: c0 }: { sectionKey: string; enabled: boolean; position: number; content: Record<string, unknown> }) {
  const [c, setC] = useState(c0);
  const [enabled, setEnabled] = useState(e0);
  const [position, setPosition] = useState(p0);
  const { pending, run, note } = useAction();
  const set = (k: string, v: unknown) => setC((x) => ({ ...x, [k]: v }));
  const textFields = Object.keys(c).filter((k) => typeof c[k] === "string" && k !== "imagePublicId");
  const listFields = Object.keys(c).filter((k) => Array.isArray(c[k]));
  const objFields = Object.keys(c).filter((k) => c[k] && typeof c[k] === "object" && !Array.isArray(c[k]));
  return (
    <details className="rounded-[12px] border border-line bg-surface" open={sectionKey === "hero"}>
      <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold">{TITLES[sectionKey] ?? sectionKey}<span className="text-sm font-normal text-muted">{sectionKey === "kitchen_page" ? "/kitchen" : enabled ? `Shown · position ${position}` : "Hidden"}</span></summary>
      <form className="flex flex-col gap-4 border-t border-line p-4" onSubmit={(e) => { e.preventDefault(); run(() => saveSection(sectionKey, c, enabled, position)); }}>
        {sectionKey !== "kitchen_page" && <div className="flex gap-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-5 accent-[var(--color-brand)]" />Show this section</label>
          <label className="flex items-center gap-2 text-sm">Position<input type="number" value={position} onChange={(e) => setPosition(Number(e.target.value))} className={`${inp} w-20`} /></label></div>}
        {textFields.map((k) => (
          <L key={k} label={label(k) + (["chips", "perks", "promises"].includes(k) ? " (comma separated)" : "")}>
            {String(c[k]).length > 80 || k === "title" ? <textarea rows={k === "title" ? 2 : 3} value={String(c[k])} onChange={(e) => set(k, e.target.value)} className="rounded-[8px] border border-line-strong bg-raised p-3 text-sm font-normal" /> : <input value={String(c[k])} onChange={(e) => set(k, e.target.value)} className={inp} />}
          </L>
        ))}
        {"imagePublicId" in c && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative size-24 overflow-hidden rounded-[8px] bg-raised">{c.imagePublicId ? <Image src={String(c.imagePublicId)} alt="" fill sizes="96px" className="object-cover" /> : <span className="grid h-full place-items-center text-xs text-muted">No photo</span>}</div>
            <CloudinaryUpload folder="cloud-kitchen/site" accept="image/*" label="Upload photo" onUploaded={(r) => set("imagePublicId", r.publicId)} />
            {Boolean(c.imagePublicId) && <button type="button" className="text-sm text-danger" onClick={() => set("imagePublicId", "")}>Remove</button>}
            {String(c.imagePublicId).includes("unsplash") && <p className="w-full text-xs text-warning">Trial stock photo. Upload a photo of your own food or kitchen before launch.</p>}
          </div>
        )}
        {objFields.map((k) => {
          const o = c[k] as Record<string, string>;
          return (
            <fieldset key={k} className="flex flex-col gap-2"><legend className="mb-1 text-sm font-semibold">{label(k)}</legend>
              {Object.keys(o).map((f) => <input key={f} aria-label={`${k} ${f}`} value={o[f] ?? ""} onChange={(e) => set(k, { ...o, [f]: e.target.value })} className={inp} />)}
            </fieldset>
          );
        })}
        {listFields.map((k) => {
          const list = c[k] as Item[];
          return (
            <fieldset key={k} className="flex flex-col gap-2"><legend className="mb-1 text-sm font-semibold">{label(k)}</legend>
              {list.map((it, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input aria-label="Title" value={it.title} onChange={(e) => set(k, list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className={`${inp} flex-1`} />
                  <textarea aria-label="Text" rows={2} value={it.body} onChange={(e) => set(k, list.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} className="min-w-0 flex-[2] rounded-[8px] border border-line-strong bg-raised p-2 text-sm" />
                  <button type="button" className="text-sm text-danger" onClick={() => set(k, list.filter((_, j) => j !== i))}>Remove</button>
                </div>
              ))}
              <button type="button" className="self-start text-sm font-semibold text-brand" onClick={() => set(k, [...list, { title: "", body: "" }])}>Add</button>
            </fieldset>
          );
        })}
        <div className="flex items-center gap-3"><Button type="submit" size="sm" disabled={pending}>Save section</Button>{note}</div>
      </form>
    </details>
  );
}

export function LayersEditor({ layers }: { layers: CookerLayer[] }) {
  const { pending, run, note } = useAction();
  return (
    <details className="rounded-[12px] border border-line bg-surface">
      <summary className="cursor-pointer p-4 font-semibold">Cooker layers (the six promises)</summary>
      <form className="flex flex-col gap-4 border-t border-line p-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(() => saveLayers(f)); }}>
        <p className="text-sm text-muted">Each part of the 3D cooker shows one promise, top to bottom. Only publish what your kitchen really does.</p>
        {layers.map((l) => (
          <div key={l.key} className="grid gap-2 rounded-[8px] bg-raised p-3 md:grid-cols-[140px_1fr]">
            <input aria-label={`${l.key} part name`} name={`${l.key}_name`} defaultValue={l.name} className={inp} />
            <input aria-label={`${l.key} title`} name={`${l.key}_title`} defaultValue={l.title} className={inp} />
            <textarea aria-label={`${l.key} text`} name={`${l.key}_body`} defaultValue={l.body} rows={2} className="rounded-[8px] border border-line-strong bg-surface p-3 text-sm md:col-span-2" />
          </div>
        ))}
        <div className="flex items-center gap-3"><Button type="submit" size="sm" disabled={pending}>Save layers</Button>{note}</div>
      </form>
    </details>
  );
}
