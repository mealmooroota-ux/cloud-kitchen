"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { loadGsap } from "@/components/motion/gsap";

/** Lenis smooth scrolling synced with GSAP ScrollTrigger. Desktop mouse/trackpad only: phones and tablets keep native momentum scrolling. */
export function SmoothScroll() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return; // native momentum is better on touch
    let stop = () => {};
    let cancelled = false;
    (async () => {
      const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([import("lenis"), loadGsap()]);
      if (cancelled) return;
      const lenis = new Lenis({ lerp: 0.11, smoothWheel: true, anchors: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      stop = () => { gsap.ticker.remove(tick); lenis.destroy(); };
    })();
    return () => { cancelled = true; stop(); };
  }, [path]);
  return null;
}
