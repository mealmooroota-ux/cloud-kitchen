"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Lenis smooth scrolling synced with GSAP ScrollTrigger. Off for reduced motion, touch devices and the admin. */
export function SmoothScroll() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // native momentum is better on phones
    let stop = () => {};
    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([import("lenis"), import("gsap"), import("gsap/ScrollTrigger")]);
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      stop = () => { gsap.ticker.remove(tick); lenis.destroy(); };
    })();
    return () => stop();
  }, [path]);
  return null;
}
