import Link from "next/link";
import { Shell } from "@/components/site/Shell";
import { CookerStory } from "@/components/home/CookerStory";
import { ProductCard } from "@/components/site/ProductCard";
import { DishImage } from "@/components/ui/DishImage";
import { LinkButton, btnClass } from "@/components/ui";
import { getHome, getMenu, getPlans } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { DEFAULT_LAYERS, DEFAULT_ORDER, DEFAULT_SECTIONS } from "@/lib/defaults";
import { rupees } from "@/lib/format";
import type { MealPlan, Product } from "@/lib/types";

export const revalidate = 60;

type C = Record<string, unknown>;
const str = (c: C, k: string) => String(c[k] ?? "");

export default async function Home() {
  const [{ sections, layers }, { products }, plans, settings] = await Promise.all([getHome(), getMenu(), getPlans(), getSettings()]);
  const order = Object.keys(sections).length ? Object.entries(sections).filter(([, v]) => v.enabled).sort((a, b) => a[1].position - b[1].position).map(([k]) => k) : DEFAULT_ORDER;
  const content = (k: string): C => ({ ...DEFAULT_SECTIONS[k], ...(sections[k]?.content ?? {}) });
  const healthy = products.filter((p) => p.tags.includes(String(content("healthy").tag ?? "Healthy"))).slice(0, 4);
  const signatures = products.filter((p) => p.show_on_home).slice(0, 4);
  const jsonLd = { "@context": "https://schema.org", "@type": "Restaurant", name: settings.kitchen_name, servesCuisine: ["Indian", "South Indian", "North Indian"], address: settings.kitchen_address ?? "Bengaluru", url: process.env.NEXT_PUBLIC_SITE_URL };

  const render: Record<string, () => React.ReactNode> = {
    hero: () => <Hero c={content("hero")} settings={settings} />,
    cooker: () => { const c = content("cooker"); return <CookerStory eyebrow={str(c, "eyebrow")} title={str(c, "title")} body={str(c, "body")} layers={layers.length ? layers : DEFAULT_LAYERS} />; },
    homemade: () => <Homemade c={content("homemade")} />,
    healthy: () => (healthy.length ? <Healthy c={content("healthy")} items={healthy} /> : null),
    plans: () => (plans.length ? <Plans c={content("plans")} plans={plans} /> : null),
    signatures: () => (signatures.length ? <Signatures c={content("signatures")} items={signatures} /> : null),
    how: () => <How c={content("how")} />,
    closing: () => <Closing c={content("closing")} open={settings.is_open} />,
  };
  return (
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {order.map((k) => <div key={k}>{render[k]?.()}</div>)}
    </Shell>
  );
}

function Hero({ c, settings }: { c: C; settings: { is_open: boolean } }) {
  const lines = str(c, "title").split("\n");
  return (
    <section className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 pb-16 pt-8 md:grid-cols-[1fr_minmax(0,560px)] md:gap-16 md:px-8 md:pb-28 md:pt-12">
      <div className="flex flex-col gap-7">
        <p className="flex items-center gap-2 text-sm font-semibold text-saffron">
          <span className={`size-2 rounded-full ${settings.is_open ? "bg-success" : "bg-line-strong"}`} />{str(c, "eyebrow")}
        </p>
        <h1 className="font-display text-[52px] leading-[0.98] tracking-[-0.035em] md:text-[96px]">{lines.map((l, i) => <span key={i} className="block">{l}</span>)}</h1>
        <p className="max-w-[460px] text-[17px] text-muted md:text-lg">{str(c, "body")}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/menu" size="lg">{str(c, "primaryCta")}</LinkButton>
          <LinkButton href="/plans" size="lg" variant="secondary">{str(c, "secondaryCta")}</LinkButton>
        </div>
      </div>
      <DishImage publicId={str(c, "imagePublicId") || null} name="Home-style thali" sizes="(min-width: 768px) 560px, 100vw" priority aspect="aspect-[6/7]" className="rounded-[32px]" />
    </section>
  );
}

function Homemade({ c }: { c: C }) {
  const points = (c.points as { title: string; body: string }[]) ?? [];
  return (
    <section className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-20 md:grid-cols-[minmax(0,520px)_1fr] md:gap-16 md:px-8 md:py-32">
      <DishImage publicId={str(c, "imagePublicId") || null} name="Our kitchen, hands at work" sizes="(min-width: 768px) 520px, 100vw" aspect="aspect-[7/8]" className="rounded-[32px]" />
      <div className="flex flex-col gap-6">
        <p className="text-sm font-semibold text-herb">{str(c, "eyebrow")}</p>
        <h2 className="font-display text-[36px] leading-[1.05] md:text-[56px]">{str(c, "title")}</h2>
        <p className="max-w-[560px] text-[17px] text-muted">{str(c, "body")}</p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {points.map((p) => (
            <li key={p.title} className="rounded-[20px] border border-line bg-surface p-6">
              <span className="mb-3 grid size-10 place-items-center rounded-[12px] bg-herb-soft text-herb" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 12 5 5 9-10" /></svg>
              </span>
              <h3 className="text-[17px] font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Healthy({ c, items }: { c: C; items: Product[] }) {
  return (
    <section className="bg-herb-soft py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-4 md:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="flex max-w-[640px] flex-col gap-3">
            <p className="text-sm font-semibold text-herb">{str(c, "eyebrow")}</p>
            <h2 className="font-display text-[34px] leading-[1.05] md:text-[56px]">{str(c, "title")}</h2>
            <p className="text-muted">{str(c, "body")}</p>
          </div>
          <Link href={`/menu?tag=${encodeURIComponent(str(c, "tag") || "Healthy")}`} className="font-semibold text-ink underline-offset-4 hover:underline">All healthy dishes</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </div>
    </section>
  );
}

function Plans({ c, plans }: { c: C; plans: MealPlan[] }) {
  return (
    <section id="plans" className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 md:py-32">
      <div className="mx-auto mb-12 flex max-w-[860px] flex-col items-center gap-4 text-center">
        <p className="text-sm font-semibold text-saffron">{str(c, "eyebrow")}</p>
        <h2 className="font-display text-[38px] leading-[1.02] md:text-[64px]">{str(c, "title")}</h2>
        <p className="max-w-[560px] text-[17px] text-muted">{str(c, "body")}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.filter((p) => p.show_on_home).map((p) => {
          const monthly = p.meal_plan_prices?.find((x) => x.duration_days >= 28) ?? p.meal_plan_prices?.[0];
          const hi = p.highlight;
          return (
            <article key={p.id} className={`flex flex-col gap-5 rounded-[24px] border p-8 ${hi ? "border-ink bg-ink text-ground" : "border-line bg-surface"}`}>
              <p className={`text-sm font-semibold ${hi ? "text-[#E2B85A]" : "text-saffron"}`}>{p.label}</p>
              <h3 className="font-display text-[34px] leading-none">{p.name}</h3>
              <p className={hi ? "text-[#CFC5B6]" : "text-muted"}>{p.description}</p>
              {monthly && <p className="flex items-baseline gap-2"><span className="tabular font-mono text-[30px] font-medium">{rupees(monthly.veg_price_paise)}</span><span className={`text-sm ${hi ? "text-[#CFC5B6]" : "text-muted"}`}>/ {monthly.label}</span></p>}
              <ul className="flex flex-1 flex-col gap-2.5">
                {p.features.map((f) => <li key={f} className="flex gap-2.5 text-[15px]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hi ? "#E2B85A" : "var(--color-herb)"} strokeWidth="2" className="mt-0.5 shrink-0" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>{f}</li>)}
              </ul>
              <Link href={`/plans?plan=${p.slug}`} className={hi ? btnClass("primary", "lg") : btnClass("secondary", "lg")}>Choose {p.name}</Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Signatures({ c, items }: { c: C; items: Product[] }) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 md:py-28">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-saffron">{str(c, "eyebrow")}</p>
          <h2 className="font-display text-[34px] leading-[1.05] md:text-[56px]">{str(c, "title")}</h2>
        </div>
        <Link href="/menu" className="shrink-0 font-semibold underline-offset-4 hover:underline">Full menu</Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} showTags={false} />)}</div>
    </section>
  );
}

function How({ c }: { c: C }) {
  const steps = (c.steps as { title: string; body: string }[]) ?? [];
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-20 md:px-8 md:pb-28">
      <ol className="grid gap-10 md:grid-cols-3 md:gap-12">
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-col gap-3 border-t border-line pt-6">
            <span className="tabular font-mono text-sm text-brand">{i + 1}</span>
            <h3 className="font-display text-[26px] leading-tight">{s.title}</h3>
            <p className="text-[15px] text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Closing({ c, open }: { c: C; open: boolean }) {
  return (
    <section className="mx-4 flex flex-col items-start justify-between gap-6 rounded-[32px] border border-line bg-surface px-6 py-12 md:mx-auto md:max-w-[1216px] md:flex-row md:items-center md:px-16 md:py-24">
      <h2 className="font-display text-[44px] leading-none md:text-[72px]">{str(c, "title")}</h2>
      <div className="flex flex-col gap-3 md:items-end">
        <LinkButton href="/menu" size="lg">{str(c, "cta")}</LinkButton>
        <span className="text-sm text-muted">{open ? "The kitchen is open now" : "The kitchen is closed right now. Browse the menu or start a meal plan."}</span>
      </div>
    </section>
  );
}
