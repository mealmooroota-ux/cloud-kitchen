import Link from "next/link";
import type { Product } from "@/lib/types";
import { DishImage } from "@/components/ui/DishImage";
import { Tag, VegMark } from "@/components/ui";
import { AddButton } from "@/components/cart/AddButton";
import { rupees } from "@/lib/format";

export function ProductCard({ p, showTags = true }: { p: Product; showTags?: boolean }) {
  const img = p.product_media?.find((m) => m.kind === "image")?.public_id ?? null;
  const required = (p.addon_groups ?? []).some((g) => g.min_select > 0);
  return (
    <article className={`group flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface ${p.is_available ? "" : "opacity-60"}`}>
      <Link href={`/menu/${p.slug}`} className="block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <DishImage publicId={img} name={p.name} sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw" className="transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {showTags && p.tags.length > 0 && <div className="mb-1 flex flex-wrap gap-1.5">{p.tags.slice(0, 2).map((t) => <Tag key={t}>{t}</Tag>)}</div>}
        <h3 className="flex items-center gap-2 text-[17px] font-semibold leading-6"><VegMark veg={p.is_veg} /><Link href={`/menu/${p.slug}`} className="hover:underline pointer-coarse:-my-2.5 pointer-coarse:inline-block pointer-coarse:py-2.5">{p.name}</Link></h3>
        <p className="line-clamp-2 text-sm text-muted">{p.description}</p>
        <p className="text-[13px] text-muted">{p.prep_minutes} min{p.serves ? ` · Serves ${p.serves}` : ""}{p.calories ? ` · ${p.calories} kcal` : ""}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="tabular font-mono text-[17px] font-medium">{rupees(p.price_paise)}</span>
          <AddButton product={{ ...p, imageId: img }} hasRequiredChoices={required} />
        </div>
      </div>
    </article>
  );
}
