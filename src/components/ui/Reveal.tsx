"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Fades content up as it enters the viewport. No-JS and reduced-motion users see it immediately. */
export function Reveal({ children, as = "div", delay = 0, className = "" }: { children: ReactNode; as?: "div" | "li" | "section"; delay?: number; className?: string }) {
  const Tag = as as "div";
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.classList.add("in"); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>;
}
