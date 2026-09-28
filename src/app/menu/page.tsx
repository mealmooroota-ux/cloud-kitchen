import Link from "next/link";
import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { ProductCard } from "@/components/site/ProductCard";
import { Empty, VegMark } from "@/components/ui";
import { getMenu } from "@/lib/queries";

export const revalidate = 600;
export const metadata: Metadata = { title: "Menu", description: "Homemade, healthy dishes cooked to order. Updated live by our kitchen." };

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ c?: string; veg?: string; q?: string; tag?: string }> }) {
  const sp = await searchParams;
  const { categories, products } = await getMenu();
  const q = (sp.q ?? "").trim().toLowerCase();
  const list = products.filter((p) =>
    (!sp.c || categories.find((c) => c.slug === sp.c)?.id === p.category_id) &&
    (sp.veg !== "1" || p.is_veg) && (!sp.tag || p.tags.includes(sp.tag)) &&
    (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));
  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    const s = next.toString(); return s ? `/menu?${s}` : "/menu";
  };
  const chip = (active: boolean) => `inline-flex h-9 pointer-coarse:h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${active ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface hover:bg-raised"}`;
  return (
    <Shell>
      <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-8 md:px-8 md:pt-12">
        <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:items-end md:justify-between">
          <div>
            <p className="text-sm text-muted">Updated live by the kitchen</p>
            <h1 className="font-display text-[40px] leading-none md:text-[56px]">Tonight’s menu</h1>
          </div>
          <form action="/menu" className="flex min-w-0 gap-2" role="search">
            {sp.c && <input type="hidden" name="c" value={sp.c} />}
            <label htmlFor="q" className="sr-only">Search dishes</label>
            <input id="q" name="q" defaultValue={sp.q} placeholder="Search dishes, e.g. khichdi" type="search" enterKeyHint="search" className="h-12 min-w-0 flex-1 rounded-[8px] border border-line-strong bg-raised px-3.5 md:w-80 md:flex-none" />
            <Link href={qs({ veg: sp.veg === "1" ? undefined : "1" })} aria-pressed={sp.veg === "1"} className={`${chip(sp.veg === "1")} h-12 gap-2`}><VegMark veg />Veg only</Link>
          </form>
        </div>
        <nav aria-label="Categories" className="no-scrollbar sticky top-[var(--header-h)] z-30 -mx-4 mt-6 flex gap-2 overflow-x-auto overscroll-x-contain border-b border-line bg-ground px-4 py-3 md:mx-0 md:bg-ground/95 md:px-0 md:backdrop-blur">
          <Link href={qs({ c: undefined, tag: undefined })} className={chip(!sp.c && !sp.tag)}>All</Link>
          <Link href={qs({ tag: sp.tag === "Healthy" ? undefined : "Healthy", c: undefined })} className={chip(sp.tag === "Healthy")}>Healthy</Link>
          <Link href="/plans" className={chip(false)}>Meal plans</Link>
          {categories.map((c) => <Link key={c.id} href={qs({ c: c.slug, tag: undefined })} className={chip(sp.c === c.slug)}>{c.name}</Link>)}
        </nav>
        <div className="mt-8">
          {list.length === 0 ? (
            <Empty title={products.length ? "Nothing matches that" : "The menu is being set up"} body={products.length ? "Try another search or category." : "Add dishes in the admin portal and they appear here instantly."} action={<Link href="/menu" className="font-semibold text-brand">Show all dishes</Link>} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          )}
        </div>
      </div>
    </Shell>
  );
}
