import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { DishImage } from "@/components/ui/DishImage";
import { LinkButton } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { getHome } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { DEFAULT_SECTIONS, list } from "@/lib/defaults";
import { PHOTO } from "@/lib/photos";

export const revalidate = 60;
export const metadata: Metadata = { title: "Our kitchen", description: "Who cooks your MOOROOTA meals, where our ingredients come from, and how we keep the kitchen clean." };

export default async function KitchenPage() {
  const [{ sections }, settings] = await Promise.all([getHome(), getSettings()]);
  const c = { ...DEFAULT_SECTIONS.kitchen_page, ...(sections.kitchen_page?.content ?? {}) } as Record<string, unknown>;
  const day = { ...DEFAULT_SECTIONS.homemade, ...(sections.homemade?.content ?? {}) } as Record<string, unknown>;
  const team = (c.team ?? {}) as { title?: string; body?: string };
  const s = (k: string) => String(c[k] ?? "");
  return (
    <Shell>
      {/* hero */}
      <section className="mx-auto grid max-w-[1320px] items-end gap-10 px-4 pb-16 pt-10 md:grid-cols-[1fr_1.1fr] md:px-8 md:pb-24 md:pt-16">
        <Reveal className="flex flex-col gap-6">
          <p className="text-sm font-semibold text-herb">{s("eyebrow")}</p>
          <h1 className="font-display text-[48px] leading-[0.98] tracking-[-0.04em] md:text-[84px]">{s("title")}</h1>
          <p className="max-w-[520px] text-lg leading-8 text-muted">{s("body")}</p>
        </Reveal>
        <Reveal delay={100}><DishImage publicId={s("imagePublicId") || null} name="Our cooks at work" sizes="(min-width: 768px) 660px, 100vw" priority aspect="aspect-[4/3]" className="rounded-[36px]" /></Reveal>
      </section>

      {/* story */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[1320px] gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
          <Reveal className="lg:sticky lg:top-28 lg:h-fit">
            <p className="text-sm font-semibold text-saffron">Our story</p>
            <blockquote className="mt-5 font-display text-[32px] italic leading-[1.15] md:text-[44px]">“{s("quote")}”</blockquote>
          </Reveal>
          <div className="flex flex-col gap-12">
            {list(c.story).map((st, i) => (
              <Reveal key={i} delay={i * 60} className="flex flex-col gap-3">
                <h2 className="font-display text-[28px] md:text-[34px]">{st.title}</h2>
                <p className="text-[17px] leading-8 text-muted">{st.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* a day in the kitchen */}
      <section className="mx-auto max-w-[1320px] px-4 py-20 md:px-8 md:py-28">
        <Reveal className="mb-12 flex flex-col gap-4">
          <p className="text-sm font-semibold text-saffron">{String(day.timelineTitle ?? "A day in our kitchen")}</p>
          <h2 className="font-display text-[38px] leading-[1.02] md:text-[60px]">Up before the city. Cooking till it sleeps.</h2>
        </Reveal>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list(day.timeline).map((t, i) => (
            <Reveal as="li" key={i} delay={i * 60} className="flex flex-col gap-3 rounded-[24px] border border-line bg-surface p-7">
              <span className="tabular font-mono text-lg text-brand">{t.title}</span>
              <p className="text-[16px] leading-7">{t.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* sourcing */}
      <section className="bg-herb-soft py-20 md:py-28">
        <div className="mx-auto grid max-w-[1320px] gap-12 px-4 md:px-8 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <Reveal className="flex flex-col gap-5">
            <p className="text-sm font-semibold text-herb">Where it comes from</p>
            <h2 className="font-display text-[38px] leading-[1.02] md:text-[56px]">Good food starts at the market, not the stove.</h2>
            <DishImage publicId={PHOTO.threeBowls} name="Fresh ingredients" sizes="(min-width: 1024px) 520px, 100vw" aspect="aspect-[4/3]" className="mt-4 rounded-[28px]" />
          </Reveal>
          <div className="grid content-center gap-x-10 gap-y-10 sm:grid-cols-2">
            {list(c.sourcing).map((it, i) => (
              <Reveal key={i} delay={i * 70} className="flex flex-col gap-2 border-t border-herb/30 pt-5">
                <h3 className="text-lg font-semibold">{it.title}</h3>
                <p className="text-[15px] leading-7 text-muted">{it.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* hygiene */}
      <section className="mx-auto max-w-[1320px] px-4 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <Reveal className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-saffron">Hygiene, every shift</p>
            <h2 className="font-display text-[38px] leading-[1.02] md:text-[56px]">A kitchen you’d be happy to walk into.</h2>
            {settings.fssai_license && <p className="tabular mt-2 font-mono text-sm text-muted">FSSAI licence {settings.fssai_license}</p>}
          </Reveal>
          <ul className="flex flex-col">
            {list(c.hygiene).map((it, i) => (
              <Reveal as="li" key={i} delay={i * 50} className="flex gap-5 border-b border-line py-6 first:border-t">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 5 5 9-10" /></svg></span>
                <span><span className="block text-lg font-semibold">{it.title}</span><span className="text-[15px] leading-7 text-muted">{it.body}</span></span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* team + CTA */}
      <section className="mx-auto max-w-[1320px] px-4 md:px-8">
        <Reveal className="grid overflow-hidden rounded-[40px] bg-ink text-ground md:grid-cols-2">
          <DishImage publicId={PHOTO.bananaLeafMeal} name="A MOOROOTA meal" sizes="(min-width: 768px) 660px, 100vw" aspect="aspect-[4/3] md:aspect-auto md:h-full" />
          <div className="flex flex-col justify-center gap-6 p-8 md:p-14">
            <h2 className="font-display text-[36px] leading-[1.05] md:text-[52px]">{team.title}</h2>
            <p className="text-[17px] leading-8 text-[#CFC5B6]">{team.body}</p>
            <div className="flex flex-col gap-3 sm:flex-row"><LinkButton href="/menu" size="lg">Taste it tonight</LinkButton><LinkButton href="/plans" size="lg" variant="secondary">See meal plans</LinkButton></div>
          </div>
        </Reveal>
      </section>
    </Shell>
  );
}
