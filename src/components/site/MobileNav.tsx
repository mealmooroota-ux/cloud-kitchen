"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const path = usePathname();
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    // Lock page scroll behind the menu. Only the root element: locking <body> too would make it a
    // scroll box of its own, and the sticky header (with the close button) would slide off-screen.
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    // Older iOS ignores overflow on the root for touch: also stop swipes that start outside the menu.
    const onTouch = (e: TouchEvent) => { if (!(e.target as Element | null)?.closest?.("#mobile-nav")) e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => wide.matches && setOpen(false);
    document.addEventListener("touchmove", onTouch, { passive: false });
    window.addEventListener("keydown", onKey); wide.addEventListener("change", onWide);
    return () => {
      html.style.overflow = prev;
      document.removeEventListener("touchmove", onTouch);
      window.removeEventListener("keydown", onKey); wide.removeEventListener("change", onWide);
    };
  }, [open]);
  return (
    <div className="lg:hidden">
      <button type="button" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)} className="grid size-11 place-items-center rounded-[12px] hover:bg-raised">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}</svg>
      </button>
      {/* Rendered into <body> so it always covers the screen, whatever styles the header has. */}
      {open && mounted && createPortal(
        <nav id="mobile-nav" aria-label="Mobile" className="mobile-nav fixed inset-x-0 bottom-0 z-[45] flex flex-col gap-1 overflow-y-auto overscroll-contain bg-ground px-4 pt-4" style={{ top: "var(--header-h)", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
          {items.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`border-b border-line py-4 font-display text-[28px] min-[380px]:text-[32px] ${path === n.href ? "text-brand" : ""}`}>{n.label}</Link>)}
          <Link href="/account" onClick={() => setOpen(false)} className="border-b border-line py-4 font-display text-[28px] min-[380px]:text-[32px]">Account</Link>
          <p className="mt-auto pt-8 text-sm text-muted">{BRAND.name} · {BRAND.tagline}</p>
        </nav>,
        document.body,
      )}
    </div>
  );
}
