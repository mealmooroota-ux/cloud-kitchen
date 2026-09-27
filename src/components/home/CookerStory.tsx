"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CookerLayer } from "@/lib/types";
import { useTier } from "@/components/three/useTier";

const CookerCanvas = dynamic(() => import("@/components/three/CookerCanvas"), { ssr: false });

export function CookerStory({ eyebrow, title, body, layers }: { eyebrow: string; title: string; body: string; layers: CookerLayer[] }) {
  const tier = useTier();
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const activeKey = useRef<string | null>(null);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(0);
  const top = useMemo(() => [...layers].sort((a, b) => a.position - b.position), [layers]); // vent first

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
          const p = self.progress;
          // 0–10% opens, then one promise per slice, reassembles in the last 8%
          progress.current = p < 0.1 ? p / 0.1 : p > 0.92 ? Math.max(0, 1 - (p - 0.92) / 0.08) : 1;
          const idx = Math.min(top.length - 1, Math.max(0, Math.floor(((p - 0.1) / 0.82) * top.length)));
          activeKey.current = top[idx]?.key ?? null;
          setActive(idx);
        },
      });
      kill = () => st.kill();
    })();
    return () => kill();
  }, [tier, top]);

  const Header = (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-saffron">{eyebrow}</p>
      <h2 className="font-display text-[34px] leading-[1.02] tracking-[-0.03em] md:text-[52px]">{title}</h2>
      <p className="max-w-[460px] text-[16px] leading-7 text-muted">{body}</p>
    </div>
  );

  if (tier !== "full") {
    return (
      <section id="layers" ref={section} className="bg-raised py-20 md:py-32">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 md:grid-cols-[1fr_1fr] md:px-8">
          <Image src="/images/cooker-exploded.webp" alt="A rice cooker taken apart into its six layers" width={800} height={991} className="mx-auto w-full max-w-[440px]" sizes="(min-width: 768px) 440px, 90vw" />
          <div className="flex flex-col gap-10">
            {Header}
            <ol className="flex flex-col gap-6">{top.map((l, i) => <Card key={l.key} l={l} i={i} total={top.length} compact />)}</ol>
          </div>
        </div>
      </section>
    );
  }

  const cur = top[active];
  return (
    <section id="layers" ref={section} className="relative bg-raised" style={{ height: `${top.length * 75 + 100}vh` }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="mx-auto grid h-full max-w-[1320px] grid-rows-[auto_1fr_auto] px-4 pt-20 md:grid-cols-[1.1fr_1fr] md:grid-rows-1 md:gap-12 md:px-8 md:pt-24">
          {/* phones: header on top */}
          <div className="pt-2 md:hidden">{Header}</div>
          <div className="relative min-h-0">
            {near && <CookerCanvas progress={progress} active={activeKey} framing="story" className="absolute inset-0" />}
          </div>
          <div className="flex flex-col justify-center gap-8 pb-8 md:pb-24">
            <div className="hidden md:block">{Header}</div>
            <div aria-live="polite" className="min-h-[170px]">{cur && <Card key={cur.key} l={cur} i={active} total={top.length} />}</div>
            <ol className="flex gap-1.5" aria-hidden="true">
              {top.map((l, i) => <li key={l.key} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= active ? "bg-brand" : "bg-line-strong/30"}`} />)}
            </ol>
          </div>
        </div>
      </div>
      <ol className="sr-only">{top.map((l) => <li key={l.key}>{l.name}: {l.title}. {l.body}</li>)}</ol>
    </section>
  );
}

function Card({ l, i, total, compact = false }: { l: CookerLayer; i: number; total: number; compact?: boolean }) {
  return (
    <li className={`list-none ${compact ? "" : "animate-[card-in_.6s_var(--ease-out)]"}`}>
      <p className="flex items-center gap-3 text-sm font-medium text-brand"><span className="tabular font-mono">{String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span><span className="h-px w-8 bg-brand/40" />{l.name}</p>
      <h3 className={`mt-2 font-display leading-tight ${compact ? "text-[24px]" : "text-[30px] md:text-[40px]"}`}>{l.title}</h3>
      <p className={`mt-2 max-w-[460px] text-muted ${compact ? "text-[15px]" : "text-[16px] leading-7 md:text-[17px]"}`}>{l.body}</p>
    </li>
  );
}
