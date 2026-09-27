"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoMark, MARK_BOWL, MARK_STEAM } from "@/components/brand/Logo";
import { DishImage } from "@/components/ui/DishImage";
import { btnClass } from "@/components/ui";
import { useTier } from "@/components/three/useTier";
import type { Item } from "@/lib/defaults";

const CookerCanvas = dynamic(() => import("@/components/three/CookerCanvas"), { ssr: false });

type Dish = { name: string; slug: string; image: string; veg: boolean };
const INGREDIENTS = ["Toor dal", "Curry leaves", "Jeera", "Ghee", "Ragi", "Tomato", "Coconut", "Byadgi chilli", "Hing", "Coriander", "Jaggery", "Mustard seeds", "Tamarind", "Basmati"];
const SKY = ["#2A2233", "#E9A873", "#F7F2E9", "#F3D9B1", "#E08A55", "#1F1B16"];
const INK_ON = ["#FFF8EE", "#1F1B16", "#1F1B16", "#1F1B16", "#1F1B16", "#FFF8EE"];
const MANIFESTO = "We believe everyday food should taste like home. Cooked fresh, in small batches, by people who care. No shortcuts, no reheating, no packets. Just a good meal, on time, every single day.";

export function Experience({ dishes, timeline }: { dishes: Dish[]; timeline: Item[] }) {
  const tier = useTier();
  const root = useRef<HTMLDivElement>(null);
  const cookerProgress = useRef(0);
  const [eta, setEta] = useState(32);
  const motion = tier === "full" || tier === "lite";
  const times = timeline.length ? timeline : [{ title: "5:30 AM", body: "The market run." }];

  useEffect(() => {
    if (!motion || !root.current) return;
    let revert = () => {};
    (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }, { DrawSVGPlugin }, { MotionPathPlugin }] = await Promise.all([
        import("gsap"), import("gsap/ScrollTrigger"), import("gsap/SplitText"), import("gsap/DrawSVGPlugin"), import("gsap/MotionPathPlugin"),
      ]);
      gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin);
      ScrollTrigger.config({ ignoreMobileResize: true });
      const q = gsap.utils.selector(root);

      const ctx = gsap.context(() => {
        // progress bar across the whole experience
        gsap.to(q(".xp-progress"), { scaleX: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.3 } });

        // ---------- 0. Prologue: the logo draws itself, the name rises letter by letter ----------
        const name = SplitText.create(q(".xp-name"), { type: "chars" });
        const intro = gsap.timeline({ delay: 0.2 });
        intro.from(q(".xp-logo .logo-bowl"), { scale: 0, transformOrigin: "50% 100%", duration: 0.9, ease: "back.out(1.6)" })
          .fromTo(q(".xp-logo .logo-steam"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.4, ease: "power2.inOut" }, "-=0.3")
          .from(name.chars, { yPercent: 120, opacity: 0, rotate: 8, stagger: 0.05, duration: 0.9, ease: "expo.out" }, "-=0.9")
          .from(q(".xp-tag, .xp-cue"), { opacity: 0, y: 16, stagger: 0.15, duration: 0.8 }, "-=0.4");
        gsap.to(q(".xp-prologue-inner"), { yPercent: -30, opacity: 0, scale: 0.92, ease: "none", scrollTrigger: { trigger: q(".xp-prologue"), start: "top top", end: "bottom top", scrub: true } });

        // ---------- 1. A day: the sky changes, the clock runs, the sun crosses ----------
        const day = gsap.timeline({ scrollTrigger: { trigger: q(".xp-day"), start: "top top", end: `+=${times.length * 70}%`, scrub: 1, pin: true } });
        SKY.forEach((c, i) => { if (i) day.to(q(".xp-day"), { backgroundColor: c, color: INK_ON[i], duration: 1, ease: "none" }, (i - 1)); });
        day.to(q(".xp-sun"), { motionPath: { path: "#xp-arc", align: "#xp-arc", alignOrigin: [0.5, 0.5] }, duration: SKY.length - 1, ease: "none" }, 0);
        const slots = q(".xp-slot");
        const per = (SKY.length - 1) / slots.length;
        slots.forEach((el, i) => {
          day.fromTo(el, { opacity: 0, y: 60, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: per * 0.35 }, i * per);
          if (i < slots.length - 1) day.to(el, { opacity: 0, y: -60, filter: "blur(8px)", duration: per * 0.3 }, i * per + per * 0.7);
        });

        // ---------- 2. Ingredients fly into one bowl ----------
        const ing = gsap.timeline({ scrollTrigger: { trigger: q(".xp-ing"), start: "top top", end: "+=220%", scrub: 1, pin: true } });
        q(".xp-word").forEach((el, i) => {
          const a = (i / INGREDIENTS.length) * Math.PI * 2;
          gsap.set(el, { x: Math.cos(a) * window.innerWidth * 0.42, y: Math.sin(a) * window.innerHeight * 0.38, rotate: gsap.utils.random(-18, 18), scale: gsap.utils.random(0.9, 1.5) });
          ing.to(el, { x: 0, y: window.innerHeight * 0.08, scale: 0.15, rotate: 0, opacity: 0, filter: "blur(6px)", duration: 1, ease: "power2.in" }, i * 0.06);
        });
        ing.fromTo(q(".xp-bowl .logo-bowl"), { scale: 0.2, opacity: 0, transformOrigin: "50% 60%" }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2)" }, 0.9)
          .fromTo(q(".xp-bowl .logo-steam"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.8 }, 1.3)
          .from(SplitText.create(q(".xp-ing-title"), { type: "words" }).words, { yPercent: 100, opacity: 0, stagger: 0.08, duration: 0.5 }, 1.5);

        // ---------- 3. The cooker opens; giant words slide past ----------
        ScrollTrigger.create({ trigger: q(".xp-cook"), start: "top top", end: "+=260%", scrub: 0.6, pin: true,
          onUpdate: (s) => { const p = s.progress; cookerProgress.current = p < 0.15 ? p / 0.15 : p > 0.85 ? Math.max(0, 1 - (p - 0.85) / 0.15) : 1; } });
        gsap.fromTo(q(".xp-band-a"), { xPercent: 0 }, { xPercent: -40, ease: "none", scrollTrigger: { trigger: q(".xp-cook"), start: "top top", end: "+=260%", scrub: true } });
        gsap.fromTo(q(".xp-band-b"), { xPercent: -40 }, { xPercent: 0, ease: "none", scrollTrigger: { trigger: q(".xp-cook"), start: "top top", end: "+=260%", scrub: true } });

        // ---------- 4. Horizontal dish gallery ----------
        const track = q(".xp-track")[0] as HTMLElement;
        const dist = () => track.scrollWidth - window.innerWidth;
        const horiz = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: q(".xp-gallery"), start: "top top", end: () => `+=${dist()}`, scrub: 1, pin: true, invalidateOnRefresh: true } });
        q(".xp-card").forEach((card) => {
          gsap.fromTo(card.querySelector(".xp-card-img"), { xPercent: -12 }, { xPercent: 12, ease: "none", scrollTrigger: { trigger: card, containerAnimation: horiz, start: "left right", end: "right left", scrub: true } });
          gsap.from(card, { rotate: 4, y: 60, opacity: 0.3, ease: "none", scrollTrigger: { trigger: card, containerAnimation: horiz, start: "left 95%", end: "left 55%", scrub: true } });
        });

        // ---------- 5. Manifesto: words light up as you read ----------
        const mani = SplitText.create(q(".xp-manifesto"), { type: "words" });
        gsap.fromTo(mani.words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: q(".xp-mani"), start: "top top", end: "+=180%", scrub: 1, pin: true } });

        // ---------- 6. Stove to door: the route draws, the rider follows, the ETA counts down ----------
        const eta0 = { v: 32 };
        const ride = gsap.timeline({ scrollTrigger: { trigger: q(".xp-route"), start: "top top", end: "+=240%", scrub: 1, pin: true } });
        ride.fromTo(q("#xp-road"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 1, ease: "none" }, 0)
          .to(q(".xp-rider"), { motionPath: { path: "#xp-road", align: "#xp-road", alignOrigin: [0.5, 0.5], autoRotate: false }, duration: 1, ease: "none" }, 0)
          .to(eta0, { v: 0, duration: 1, ease: "none", onUpdate: () => setEta(Math.round(eta0.v)) }, 0)
          .fromTo(q(".xp-delivered"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.15, ease: "back.out(3)" }, 1)
          .from(q(".xp-route-step"), { opacity: 0, x: -30, stagger: 0.25, duration: 0.2 }, 0.05);

        // ---------- 7. Finale ----------
        const fin = SplitText.create(q(".xp-final"), { type: "chars,words" });
        gsap.from(fin.chars, { yPercent: 120, opacity: 0, stagger: 0.025, duration: 1, ease: "expo.out", scrollTrigger: { trigger: q(".xp-end"), start: "top 70%" } });
        gsap.from(q(".xp-end-cta > *"), { y: 30, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: q(".xp-end"), start: "top 55%" } });
        gsap.fromTo(q(".xp-end .logo-steam"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.6, ease: "power2.inOut", scrollTrigger: { trigger: q(".xp-end"), start: "top 60%" } });
      }, root);
      requestAnimationFrame(() => ScrollTrigger.refresh());
      revert = () => ctx.revert();
    })();
    return () => revert();
  }, [motion, times.length]);

  const H = "font-display leading-[0.95] tracking-[-0.04em]";
  return (
    <div ref={root} className="relative">
        <div className="xp-progress fixed inset-x-0 top-16 z-30 h-[3px] origin-left scale-x-0 bg-brand md:top-20" aria-hidden="true" />

        {/* 0. Prologue */}
        <section className="xp-prologue relative grid h-[calc(100dvh-4rem)] place-items-center overflow-hidden bg-ink text-[#FFF8EE] md:h-[calc(100dvh-5rem)]">
          <div className="xp-prologue-inner flex flex-col items-center gap-6 px-4 text-center">
            <LogoMark size={132} tone="onDark" className="xp-logo" />
            <h1 className={`xp-name ${H} whitespace-nowrap text-[15vw] font-semibold tracking-[0.04em] md:text-[150px] md:tracking-[0.06em]`}>MOOROOTA</h1>
            <p className="xp-tag text-sm font-semibold uppercase tracking-[0.32em] text-[#E2B85A]">Your everyday meal · a story in motion</p>
            <p className="xp-cue mt-8 flex flex-col items-center gap-2 text-sm text-[#CFC5B6]">Scroll to begin<span className="block h-10 w-px animate-pulse bg-[#CFC5B6]" /></p>
          </div>
        </section>

        {/* 1. A day in the kitchen */}
        <section className="xp-day relative h-dvh overflow-hidden" style={{ backgroundColor: SKY[0], color: INK_ON[0] }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
            <path id="xp-arc" d="M-40 560 Q500 -140 1040 560" fill="none" stroke="currentColor" strokeOpacity=".12" strokeDasharray="4 10" />
          </svg>
          <div className="xp-sun absolute left-0 top-0 size-24 rounded-full bg-[#E2B85A] shadow-[0_0_120px_40px_rgba(226,184,90,.45)] md:size-36" aria-hidden="true" />
          <div className="relative mx-auto grid h-full max-w-[1320px] items-center px-4 md:px-8">
            <p className="absolute left-4 top-24 text-sm font-semibold uppercase tracking-[0.3em] opacity-70 md:left-8">A day in our kitchen</p>
            {times.map((t, i) => (
              <div key={i} className="xp-slot absolute inset-x-4 flex flex-col gap-4 md:inset-x-8" style={{ opacity: motion ? 0 : 1, position: motion ? "absolute" : "relative" }}>
                <span className={`${H} tabular text-[22vw] font-light md:text-[15vw]`}>{t.title}</span>
                <span className="max-w-[640px] text-2xl leading-snug md:text-4xl">{t.body}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Ingredients → one bowl */}
        <section className="xp-ing relative grid h-dvh place-items-center overflow-hidden bg-ground">
          {INGREDIENTS.map((w) => <span key={w} className={`xp-word ${H} absolute whitespace-nowrap text-[9vw] text-brand/80 md:text-[5.5vw]`} aria-hidden="true" style={{ opacity: motion ? 1 : 0 }}>{w}</span>)}
          <div className="relative flex flex-col items-center gap-6 text-center">
            <svg className="xp-bowl" width="220" height="220" viewBox="0 0 64 64" aria-hidden="true">
              <path className="logo-bowl" d={MARK_BOWL} fill="var(--color-brand)" />
              <path className="logo-steam" d={MARK_STEAM} fill="none" stroke="var(--color-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className={`xp-ing-title ${H} max-w-[900px] px-4 text-[44px] md:text-[80px]`}>Fourteen ingredients. One honest bowl.</h2>
          </div>
        </section>

        {/* 3. The cooker */}
        <section className="xp-cook relative h-dvh overflow-hidden bg-raised">
          <div className="pointer-events-none absolute inset-x-0 top-[12%] flex flex-col gap-2" aria-hidden="true">
            <p className={`xp-band-a ${H} whitespace-nowrap text-[18vw] text-transparent [-webkit-text-stroke:1.5px_var(--color-line-strong)]`}>Slow-cooked · Small batches · Slow-cooked · Small batches ·</p>
            <p className={`xp-band-b ${H} whitespace-nowrap text-[18vw] text-brand/15`}>Never reheated · Sealed for you · Never reheated · Sealed for you ·</p>
          </div>
          <div className="absolute inset-0">
            {tier === "full" ? <CookerCanvas progress={cookerProgress} framing="story" className="absolute inset-0" />
              : <Image src="/images/cooker-exploded.webp" alt="" width={800} height={991} className="absolute left-1/2 top-1/2 h-[80%] w-auto -translate-x-1/2 -translate-y-1/2" />}
          </div>
          <p className="absolute bottom-10 left-1/2 w-full max-w-[560px] -translate-x-1/2 px-4 text-center text-lg text-muted md:text-xl">Six layers, six promises. Every part of our kitchen is there on purpose.</p>
        </section>

        {/* 4. Gallery */}
        <section className="xp-gallery relative overflow-hidden bg-ink text-[#FFF8EE]">
          <div className={`xp-track flex h-dvh items-center gap-6 px-[6vw] md:gap-10 ${motion ? "w-max" : "flex-wrap h-auto py-20"}`}>
            <div className="flex w-[80vw] shrink-0 flex-col gap-5 md:w-[34vw]">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#E2B85A]">On the stove today</p>
              <h2 className={`${H} text-[56px] md:text-[96px]`}>Made this morning.</h2>
              <p className="max-w-sm text-lg text-[#CFC5B6]">Keep scrolling. Every dish here was on our stove today.</p>
            </div>
            {dishes.map((d, i) => (
              <Link key={d.slug} href={`/menu/${d.slug}`} className="xp-card group relative block h-[62vh] w-[72vw] shrink-0 overflow-hidden rounded-[32px] md:w-[30vw]">
                <div className="xp-card-img absolute -inset-x-[15%] inset-y-0"><DishImage publicId={d.image} name={d.name} sizes="(min-width: 768px) 40vw, 90vw" aspect="h-full" className="h-full" /></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                  <span><span className="tabular block font-mono text-sm text-[#E2B85A]">{String(i + 1).padStart(2, "0")}</span><span className={`${H} block text-[34px] md:text-[44px]`}>{d.name}</span></span>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#FFF8EE] text-ink transition-transform duration-300 group-hover:-rotate-45" aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
            <div className="w-[10vw] shrink-0" />
          </div>
        </section>

        {/* 5. Manifesto */}
        <section className="xp-mani grid min-h-dvh place-items-center bg-ground px-4 py-24">
          <p className={`xp-manifesto ${H} max-w-[1100px] text-[40px] md:text-[76px]`}>{MANIFESTO}</p>
        </section>

        {/* 6. Stove to door */}
        <section className="xp-route relative h-dvh overflow-hidden bg-surface">
          <div className="mx-auto grid h-full max-w-[1320px] items-center gap-6 px-4 py-24 md:grid-cols-[1fr_1.6fr] md:px-8">
            <div className="flex flex-col gap-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-saffron">Stove to door</p>
              <p className={`${H} tabular text-[96px] md:text-[160px]`} aria-live="off">{eta}<span className="text-[0.35em] text-muted"> min</span></p>
              <ol className="flex flex-col gap-3 text-lg">
                {["Cooked the moment you order", "Sealed at the pass", "Rider on the way, routed live", "At your door, still hot"].map((s, i) => <li key={s} className="xp-route-step flex items-center gap-3"><span className="tabular font-mono text-sm text-brand">0{i + 1}</span>{s}</li>)}
              </ol>
            </div>
            <div className="relative">
              <svg viewBox="0 0 800 520" className="w-full" aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="520" stroke="var(--color-line)" strokeWidth="1" />)}
                {Array.from({ length: 6 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 104} x2="800" y2={i * 104} stroke="var(--color-line)" strokeWidth="1" />)}
                <path d="M90 430 C 200 430 220 300 330 300 S 470 180 560 200 S 690 120 710 90" fill="none" stroke="var(--color-line-strong)" strokeOpacity=".25" strokeWidth="14" strokeLinecap="round" />
                <path id="xp-road" d="M90 430 C 200 430 220 300 330 300 S 470 180 560 200 S 690 120 710 90" fill="none" stroke="var(--color-brand)" strokeWidth="6" strokeLinecap="round" />
                <g transform="translate(58 400) scale(1)"><path d={MARK_BOWL} fill="var(--color-brand)" transform="scale(1)" /><path d={MARK_STEAM} fill="none" stroke="var(--color-ink)" strokeWidth="5" strokeLinecap="round" /></g>
                <g transform="translate(686 40)"><path d="M4 26 L26 6 L48 26 V52 H4 Z" fill="var(--color-ink)" /><rect x="20" y="34" width="12" height="18" fill="#FFF8EE" /></g>
                <circle className="xp-rider" cx="90" cy="430" r="14" fill="var(--color-ink)" stroke="#FFF8EE" strokeWidth="4" />
              </svg>
              <span className="xp-delivered absolute right-[4%] top-[2%] rounded-full bg-success px-4 py-2 text-sm font-semibold text-white" style={{ opacity: motion ? 0 : 1 }}>Delivered</span>
            </div>
          </div>
        </section>

        {/* 7. Finale */}
        <section className="xp-end relative grid min-h-dvh place-items-center overflow-hidden bg-brand px-4 py-24 text-[#FFF8EE]">
          <div className="flex flex-col items-center gap-8 text-center">
            <LogoMark size={96} tone="light" />
            <h2 className={`xp-final ${H} text-[64px] md:text-[150px]`}>Your everyday meal.</h2>
            <div className="xp-end-cta flex flex-col gap-3 sm:flex-row">
              <Link href="/menu" data-magnetic className="inline-flex h-14 items-center justify-center rounded-[12px] bg-[#FFF8EE] px-8 font-semibold text-ink hover:bg-white">Order tonight’s dinner</Link>
              <Link href="/plans" data-magnetic className={btnClass("secondary", "lg", "border-[#FFF8EE]/50 bg-transparent text-[#FFF8EE] hover:bg-white/10")}>Start a meal plan</Link>
            </div>
          </div>
        </section>
    </div>
  );
}
