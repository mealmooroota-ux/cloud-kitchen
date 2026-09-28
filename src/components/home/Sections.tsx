import Link from "next/link";
import { DishImage } from "@/components/ui/DishImage";
import { LinkButton, btnClass } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/site/ProductCard";
import { csv, list, type Item } from "@/lib/defaults";
import { rupees } from "@/lib/format";
import type { MealPlan, Product, Settings } from "@/lib/types";

type C = Record<string, unknown>;
const s = (c: C, k: string) => String(c[k] ?? "");
const cover = (p: Product) => p.product_media?.find((m) => m.kind === "image")?.public_id ?? null;

function Heading({ eyebrow, title, body, tone = "saffron", center = false, className = "" }: { eyebrow?: string; title: string; body?: string; tone?: "saffron" | "herb"; center?: boolean; className?: string }) {
  return (
    <Reveal className={`flex flex-col gap-4 ${center ? "mx-auto items-center text-center" : ""} ${className}`}>
      {eyebrow && <p className={`text-sm font-semibold ${tone === "herb" ? "text-herb" : "text-saffron"}`}>{eyebrow}</p>}
      <h2 data-split className="font-display text-[clamp(30px,9.5vw,38px)] leading-[1.02] tracking-[-0.03em] md:text-[64px]">{title}</h2>
      {body && <p className={`max-w-[620px] text-[17px] leading-7 text-muted md:text-lg ${center ? "mx-auto" : ""}`}>{body}</p>}
    </Reveal>
  );
}

// ---------------- Hero ----------------
export function Hero({ c, settings, today }: { c: C; settings: Settings; today: Product[] }) {
  const lines = s(c, "title").split("\n");
  return (
    <section className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-4 pb-16 pt-6 md:grid-cols-[1.05fr_1fr] md:gap-10 md:px-8 lg:gap-14 md:pb-24 md:pt-10">
      <div className="flex flex-col gap-7">
        <p className="hero-fade flex items-center gap-2 text-sm font-semibold text-saffron">
          <span className={`size-2 rounded-full ${settings.is_open ? "bg-success animate-pulse-dot" : "bg-line-strong"}`} />
          {s(c, "eyebrow")} · {settings.is_open ? "Kitchen open now" : "Kitchen closed right now"}
        </p>
        <h1 className="font-display text-[clamp(40px,12.5vw,50px)] leading-[0.96] tracking-[-0.04em] sm:text-[64px] md:text-[64px] lg:text-[76px] xl:text-[88px]">
          {lines.map((l, i) => <span key={i} className="hero-line"><span className={i === 1 ? "italic text-brand" : ""} style={{ animationDelay: `${120 + i * 140}ms` }}>{l}</span></span>)}
        </h1>
        <p className="hero-fade max-w-[520px] text-[17px] leading-7 text-muted md:text-lg" style={{ animationDelay: "420ms" }}>{s(c, "body")}</p>
        <div className="hero-fade flex flex-col gap-3 whitespace-nowrap sm:flex-row md:flex-col lg:flex-row" style={{ animationDelay: "540ms" }}>
          <LinkButton href="/menu" size="lg" data-magnetic>{s(c, "primaryCta")}</LinkButton>
          <LinkButton href="/plans" size="lg" variant="secondary">{s(c, "secondaryCta")}</LinkButton>
        </div>
        <ul className="hero-fade flex flex-wrap gap-2 pt-2" style={{ animationDelay: "660ms" }}>
          {csv(c.chips).map((chip) => <li key={chip} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium">{chip}</li>)}
        </ul>
      </div>
      <div className="hero-media relative">
        <DishImage publicId={s(c, "imagePublicId") || null} name="An everyday MOOROOTA thali" sizes="(min-width: 768px) 620px, 100vw" priority aspect="aspect-[5/6] md:aspect-[4/5]" className="rounded-[36px] shadow-[0_30px_80px_-30px_rgba(31,27,22,.45)]" />
        {today.length > 0 && (
          <div className="absolute -bottom-6 left-4 right-4 rounded-[20px] border border-line bg-surface/95 p-4 shadow-[0_18px_40px_-18px_rgba(31,27,22,.35)] md:-left-10 md:backdrop-blur md:right-auto md:w-[300px]">
            <p className="mb-2 text-xs font-semibold text-saffron">On today’s menu</p>
            <ul className="flex flex-col gap-2">
              {today.slice(0, 3).map((p) => (
                <li key={p.id}><Link href={`/menu/${p.slug}`} className="flex items-center justify-between gap-3 text-sm pointer-coarse:min-h-10"><span className="truncate font-semibold">{p.name}</span><span className="tabular shrink-0 font-mono text-muted">{rupees(p.price_paise)}</span></Link></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------- Marquee ----------------
export function Marquee({ c, items }: { c: C; items: Product[] }) {
  const row = [...items, ...items];
  return (
    <section aria-label={s(c, "label")} className="marquee overflow-hidden border-y border-line bg-surface py-5">
      <div className="marquee-track flex w-max items-center gap-10">
        {row.map((p, i) => (
          <Link key={`${p.id}-${i}`} href={`/menu/${p.slug}`} className="flex shrink-0 items-center gap-3" tabIndex={i >= items.length ? -1 : 0} aria-hidden={i >= items.length}>
            <span className="relative size-12 overflow-hidden rounded-full bg-raised"><DishImage publicId={cover(p)} name="" sizes="48px" aspect="aspect-square" /></span>
            <span className="font-display text-[22px] whitespace-nowrap">{p.name}</span>
            <span className="text-brand">✦</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------- Our food ----------------
export function Homemade({ c }: { c: C }) {
  const timeline = list(c.timeline);
  const points = list(c.points);
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-20 md:px-8 md:py-32">
      <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          <Heading eyebrow={s(c, "eyebrow")} title={s(c, "title")} tone="herb" />
          <Reveal delay={80} className="flex max-w-[640px] flex-col gap-4 text-[17px] leading-7 text-muted"><p>{s(c, "body")}</p>{s(c, "body2") && <p>{s(c, "body2")}</p>}</Reveal>
          {s(c, "imagePublicId") && <Reveal delay={120} className="mt-4 overflow-hidden rounded-[28px]"><div data-parallax="0.08" className="md:scale-[1.18]"><DishImage publicId={s(c, "imagePublicId")} name="Our cooks at work" sizes="(min-width: 1024px) 720px, 100vw" aspect="aspect-[16/9]" /></div></Reveal>}
        </div>
        {timeline.length > 0 && (
          <Reveal delay={100} className="h-fit rounded-[28px] bg-ink p-7 text-ground md:p-9 lg:sticky lg:top-28">
            <p className="text-sm font-semibold text-[#E2B85A]">{s(c, "timelineTitle")}</p>
            <ol className="mt-6 flex flex-col">
              {timeline.map((t, i) => (
                <li key={i} className="relative grid grid-cols-[88px_1fr] gap-4 pb-6 last:pb-0">
                  <span className="tabular font-mono text-sm text-[#E2B85A]">{t.title}</span>
                  <span className="border-l border-white/15 pl-4 text-[15px] leading-6 text-[#E8DFD2]">{t.body}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        )}
      </div>
      {points.length > 0 && (
        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p, i) => (
            <Reveal as="li" key={i} delay={i * 70} className="flex flex-col gap-3 rounded-[24px] border border-line bg-surface p-6">
              <span className="tabular font-mono text-sm text-herb">0{i + 1}</span>
              <h3 className="text-[18px] font-semibold leading-snug">{p.title}</h3>
              <p className="text-[15px] leading-6 text-muted">{p.body}</p>
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------- What's on your plate ----------------
export function Plate({ c }: { c: C }) {
  const items = list(c.items);
  return (
    <section className="bg-raised py-20 md:py-32">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 md:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal className="relative overflow-hidden rounded-full">
          <div className="spin-slow"><DishImage publicId={s(c, "imagePublicId") || null} name="A balanced everyday thali" sizes="(min-width: 1024px) 600px, 100vw" aspect="aspect-square" className="rounded-full" /></div>
        </Reveal>
        <div className="flex flex-col gap-8">
          <Heading eyebrow={s(c, "eyebrow")} title={s(c, "title")} body={s(c, "body")} />
          <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {items.map((it, i) => (
              <Reveal as="li" key={i} delay={i * 60} className="flex gap-4 border-t border-line-strong/30 pt-4">
                <span className="tabular font-mono text-sm text-brand">{String(i + 1).padStart(2, "0")}</span>
                <span><span className="block font-semibold">{it.title}</span><span className="text-[15px] leading-6 text-muted">{it.body}</span></span>
              </Reveal>
            ))}
          </ol>
          {s(c, "note") && <p className="text-sm text-muted">{s(c, "note")}</p>}
        </div>
      </div>
    </section>
  );
}

// ---------------- Dish grids ----------------
export function DishGrid({ c, items, tone = "saffron", bg = "", link }: { c: C; items: Product[]; tone?: "saffron" | "herb"; bg?: string; link: { href: string; label: string } }) {
  return (
    <section className={`py-20 md:py-28 ${bg}`}>
      <div className="mx-auto max-w-[1320px] px-4 md:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Heading eyebrow={s(c, "eyebrow")} title={s(c, "title")} body={s(c, "body")} tone={tone} />
          <Link href={link.href} className="inline-flex shrink-0 items-center font-semibold underline-offset-4 hover:underline pointer-coarse:min-h-11">{link.label} →</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{items.map((p, i) => <Reveal key={p.id} delay={i * 60}><ProductCard p={p} /></Reveal>)}</div>
      </div>
    </section>
  );
}

// ---------------- Meal plans ----------------
export function Plans({ c, plans }: { c: C; plans: MealPlan[] }) {
  const shown = plans.filter((p) => p.show_on_home);
  return (
    <section id="plans" className="mx-auto max-w-[1320px] px-4 pt-20 md:px-8 md:pt-32">
      <Heading eyebrow={s(c, "eyebrow")} title={s(c, "title")} body={s(c, "body")} center className="mb-14 max-w-[900px]" />
      <div className="grid gap-6 md:grid-cols-3">
        {shown.map((p, i) => {
          const monthly = p.meal_plan_prices?.find((x) => x.duration_days >= 28) ?? p.meal_plan_prices?.[0];
          const hi = p.highlight;
          const perDay = monthly ? Math.round(monthly.veg_price_paise / monthly.duration_days / 100) * 100 : null;
          return (
            <Reveal key={p.id} delay={i * 80} className={`flex flex-col gap-5 rounded-[28px] border p-6 sm:p-8 ${hi ? "border-ink bg-ink text-ground md:-translate-y-4" : "border-line bg-surface"}`}>
              <div className="flex items-center justify-between"><p className={`text-sm font-semibold ${hi ? "text-[#E2B85A]" : "text-saffron"}`}>{p.label}</p>{hi && <span className="rounded-full bg-[#E2B85A] px-3 py-1 text-xs font-semibold text-ink">Most popular</span>}</div>
              <h3 className="font-display text-[36px] leading-none">{p.name}</h3>
              <p className={hi ? "text-[#CFC5B6]" : "text-muted"}>{p.description}</p>
              {monthly && <div><p className="flex items-baseline gap-2"><span className="tabular font-mono text-[32px] font-medium">{rupees(monthly.veg_price_paise)}</span><span className={`text-sm ${hi ? "text-[#CFC5B6]" : "text-muted"}`}>/ {monthly.label}</span></p>{perDay && <p className={`text-sm ${hi ? "text-[#CFC5B6]" : "text-muted"}`}>About {rupees(perDay)} a day</p>}</div>}
              <ul className="flex flex-1 flex-col gap-2.5">
                {p.features.map((f) => <li key={f} className="flex gap-2.5 text-[15px]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hi ? "#E2B85A" : "var(--color-herb)"} strokeWidth="2" className="mt-0.5 shrink-0" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>{f}</li>)}
              </ul>
              <Link href={`/plans?plan=${p.slug}`} className={hi ? btnClass("primary", "lg") : btnClass("secondary", "lg")}>Choose {p.name}</Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function PlansHow({ c }: { c: C }) {
  const steps = list(c.steps);
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-20 md:px-8 md:py-28">
      <div className="rounded-[36px] border border-line bg-surface p-6 md:p-14">
        <Heading eyebrow={s(c, "eyebrow")} title={s(c, "title")} />
        <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((st, i) => (
            <Reveal as="li" key={i} delay={i * 80} className="flex flex-col gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-brand-soft font-display text-xl text-brand">{i + 1}</span>
              <h3 className="font-display text-[24px] leading-tight">{st.title}</h3>
              <p className="text-[15px] leading-6 text-muted">{st.body}</p>
            </Reveal>
          ))}
        </ol>
        <div className="mt-12 flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-2">{csv(c.perks).map((p) => <li key={p} className="rounded-full bg-herb-soft px-3.5 py-1.5 text-[13px] font-semibold text-herb">{p}</li>)}</ul>
          <LinkButton href="/plans" size="lg">Build your plan</LinkButton>
        </div>
      </div>
    </section>
  );
}

// ---------------- How ordering works ----------------
export function How({ c }: { c: C }) {
  const steps = list(c.steps);
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-20 md:px-8 md:py-28">
      <Heading eyebrow={s(c, "eyebrow")} title={s(c, "title")} className="mb-12" />
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map((st, i) => (
          <Reveal as="li" key={i} delay={i * 90} className="relative flex flex-col gap-4 overflow-hidden rounded-[28px] bg-raised p-6 sm:p-8">
            <span className="font-display text-[88px] leading-none text-brand/15" aria-hidden="true">{i + 1}</span>
            <h3 className="font-display text-[28px] leading-tight">{st.title}</h3>
            <p className="text-[15px] leading-6 text-muted">{st.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

// ---------------- FAQ ----------------
export function Faq({ c, limit }: { c: C; limit?: number }) {
  const items = list(c.items).slice(0, limit);
  return (
    <section className="mx-auto grid max-w-[1320px] gap-10 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:h-fit"><Heading eyebrow={s(c, "eyebrow")} title={s(c, "title")} /></div>
      <div className="flex flex-col">
        {items.map((it: Item, i) => (
          <details key={i} className="faq group border-b border-line py-6 first:border-t">
            <summary className="flex min-h-11 items-center justify-between gap-6 text-lg font-semibold md:text-xl">{it.title}<span className="faq-icon grid size-9 shrink-0 place-items-center rounded-full border border-line-strong text-xl transition-transform duration-300" aria-hidden="true">+</span></summary>
            <p className="mt-3 max-w-[680px] text-[16px] leading-7 text-muted">{it.body}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ---------------- Closing ----------------
export function Closing({ c, settings }: { c: C; settings: Settings }) {
  const hours = `${settings.open_time.slice(0, 5)} – ${settings.close_time.slice(0, 5)}`;
  return (
    <section className="mx-auto max-w-[1320px] px-4 pb-8 md:px-8">
      <Reveal className="overflow-hidden rounded-[40px] bg-ink text-ground">
        <div className="grid gap-12 p-6 sm:p-8 md:p-16 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <h2 data-split className="font-display text-[clamp(42px,14vw,56px)] leading-[0.95] tracking-[-0.04em] md:text-[104px]">{s(c, "title")}</h2>
            <p className="max-w-[520px] text-[17px] leading-7 text-[#CFC5B6] md:text-lg">{s(c, "body")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/menu" size="lg" data-magnetic>{s(c, "cta")}</LinkButton>
              <Link href="/plans" className="inline-flex h-14 items-center justify-center rounded-[12px] border border-white/30 px-7 font-semibold text-ground hover:bg-white/10">{s(c, "secondaryCta")}</Link>
            </div>
          </div>
          <dl className="grid content-end gap-6 text-sm sm:grid-cols-2 lg:grid-cols-1">
            <div className="border-t border-white/15 pt-4"><dt className="text-[#E2B85A]">Kitchen hours</dt><dd className="mt-1 text-lg">{hours} · every day</dd><dd className="mt-1 flex items-center gap-2 text-[#CFC5B6]"><span className={`size-2 rounded-full ${settings.is_open ? "bg-success" : "bg-white/30"}`} />{settings.is_open ? "Open now" : "Closed right now"}</dd></div>
            <div className="border-t border-white/15 pt-4"><dt className="text-[#E2B85A]">We deliver</dt><dd className="mt-1 text-lg">Within {Number(settings.delivery_radius_km)} km of our kitchen</dd><dd className="mt-1 text-[#CFC5B6]">Check your address at checkout</dd></div>
            {(settings.support_phone || settings.support_email) && <div className="border-t border-white/15 pt-4"><dt className="text-[#E2B85A]">Talk to us</dt><dd className="mt-1 text-lg">{settings.support_phone ?? settings.support_email}</dd></div>}
          </dl>
        </div>
        <ul className="grid border-t border-white/10 sm:grid-cols-3">
          {csv(c.promises).map((p, i) => <li key={p} className={`px-6 py-6 text-[15px] sm:px-8 md:px-16 ${i > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""}`}><span className="mr-2 text-[#E2B85A]">✦</span>{p}</li>)}
        </ul>
      </Reveal>
    </section>
  );
}
