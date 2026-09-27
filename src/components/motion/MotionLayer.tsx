"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Site-wide motion, driven by data attributes so pages stay server-rendered:
 *  - [data-split]        headings rise in word by word when they enter the viewport
 *  - [data-parallax=0.1] images drift at a different speed while scrolling
 *  - [data-magnetic]     buttons lean toward the cursor (mouse only)
 * Everything is skipped for prefers-reduced-motion.
 */
export function MotionLayer() {
  const path = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("gsap/SplitText")]);
      gsap.registerPlugin(ScrollTrigger, SplitText);
      const ctx = gsap.context(() => {
        document.querySelectorAll<HTMLElement>("[data-split]:not([data-split-done])").forEach((el) => {
          el.dataset.splitDone = "1";
          const split = SplitText.create(el, { type: "words,lines", mask: "lines", linesClass: "split-line" });
          gsap.from(split.words, { yPercent: 110, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.04, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        });
        document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const amt = Number(el.dataset.parallax) || 0.12;
          gsap.fromTo(el, { yPercent: -amt * 100 }, { yPercent: amt * 100, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } });
        });
      });
      const fine = window.matchMedia("(pointer: fine)").matches;
      const offs: (() => void)[] = [];
      if (fine) document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
        const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35); };
        const leave = () => { xTo(0); yTo(0); };
        el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
        offs.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
      cleanup = () => { ctx.revert(); offs.forEach((f) => f()); document.querySelectorAll<HTMLElement>("[data-split-done]").forEach((el) => delete el.dataset.splitDone); };
    })();
    return () => cleanup();
  }, [path]);
  return null;
}
