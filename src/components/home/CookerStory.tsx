"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CookerLayer } from "@/lib/types";
import { useTier } from "@/components/three/useTier";

const CookerCanvas = dynamic(() => import("@/components/three/CookerCanvas"), { ssr: false });

export function CookerStory({ eyebrow, title, body, layers }: { eyebrow: string; title: string; body: string; layers: CookerLayer[] }) {
  const tier = useTier();
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(-1);
  const top = [...layers].sort((a, b) => a.position - b.position); // vent first

  useEffect(() => {
    if (!section.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "800px" });
    io.observe(section.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (tier !== "full" || !section.current) return;
    let kill = () => {};
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: section.current, start: "top top", end: "bottom bottom", scrub: 0.6,
        onUpdate: (self) => {
          // 0–15% opens, 15–85% reveals one promise at a time, holds, then reassembles at the very end
          const p = self.progress;
          progress.current = p < 0.12 ? p / 0.12 : p > 0.92 ? Math.max(0, 1 - (p - 0.92) / 0.08) : 1;
          const idx = p < 0.12 ? -1 : Math.min(top.length - 1, Math.floor(((p - 0.12) / 0.72) * top.length));
          setActive(p > 0.92 ? top.length : idx);
        },
      });
      kill = () => st.kill();
    })();
    return () => kill();
  }, [tier, top.length]);

  const header = (
    <div className="mx-auto flex max-w-[820px] flex-col items-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold text-saffron">{eyebrow}</p>
      <h2 className="font-display text-[40px] leading-[1.02] md:text-[64px]">{title}</h2>
      <p className="max-w-[520px] text-[17px] text-muted">{body}</p>
    </div>
  );

  if (tier !== "full") {
    // Lite / static / first paint: the rendered still + the same promises as plain text.
    return (
      <section id="layers" ref={section} className="bg-raised py-20 md:py-32">
        {header}
        <div className="mx-auto mt-12 grid max-w-[1180px] items-center gap-10 px-4 md:grid-cols-[1fr_minmax(0,420px)_1fr] md:px-8">
          <ol className="flex flex-col gap-8 md:text-right">{top.slice(0, 3).map((l) => <LayerPromise key={l.key} l={l} />)}</ol>
          <Image src="/images/cooker-exploded.webp" alt="A rice cooker taken apart into its six layers" width={800} height={991} className="mx-auto w-full max-w-[420px]" sizes="(min-width: 768px) 420px, 90vw" />
          <ol className="flex flex-col gap-8">{top.slice(3).map((l) => <LayerPromise key={l.key} l={l} />)}</ol>
        </div>
      </section>
    );
  }

  return (
    <section id="layers" ref={section} className="relative bg-raised" style={{ height: "420vh" }}>
      <div className="sticky top-0 flex h-dvh flex-col overflow-hidden pt-20 md:pt-24">
        {header}
        <div className="relative mx-auto grid w-full max-w-[1280px] flex-1 grid-rows-[1fr_auto] px-4 md:grid-cols-[1fr_minmax(0,460px)_1fr] md:grid-rows-1 md:px-8">
          <ol className="hidden flex-col justify-center gap-10 text-right md:flex">
            {top.slice(0, 3).map((l, i) => <LayerPromise key={l.key} l={l} shown={active >= i} />)}
          </ol>
          <div className="relative min-h-0">
            {near && <CookerCanvas progress={progress} className="absolute inset-0" />}
          </div>
          <ol className="hidden flex-col justify-center gap-10 md:flex">
            {top.slice(3).map((l, i) => <LayerPromise key={l.key} l={l} shown={active >= i + 3} />)}
          </ol>
          {/* phones: one promise at a time under the cooker */}
          <div className="min-h-[150px] pb-8 text-center md:hidden" aria-live="polite">
            {active >= 0 && active < top.length && <LayerPromise l={top[active]} shown />}
          </div>
        </div>
      </div>
      {/* accessible copy for screen readers regardless of scroll */}
      <ol className="sr-only">{top.map((l) => <li key={l.key}>{l.name}: {l.title}. {l.body}</li>)}</ol>
    </section>
  );
}

function LayerPromise({ l, shown = true }: { l: CookerLayer; shown?: boolean }) {
  return (
    <li className="list-none transition-all duration-500 ease-[var(--ease-out)]" style={{ opacity: shown ? 1 : 0.12, transform: shown ? "none" : "translateY(8px)" }} aria-hidden={!shown}>
      <p className="text-sm font-medium text-brand">{l.name}</p>
      <h3 className="mt-1 font-display text-[24px] leading-tight md:text-[28px]">{l.title}</h3>
      <p className="mt-1.5 text-[15px] text-muted">{l.body}</p>
    </li>
  );
}
