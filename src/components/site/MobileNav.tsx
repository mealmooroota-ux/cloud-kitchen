"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);
  return (
    <div className="md:hidden">
      <button type="button" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)} className="grid size-11 place-items-center rounded-[12px] hover:bg-raised">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}</svg>
      </button>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col gap-1 bg-ground px-4 pb-10 pt-6">
          {items.map((n) => <Link key={n.href} href={n.href} className="border-b border-line py-4 font-display text-[32px]">{n.label}</Link>)}
          <Link href="/account" className="border-b border-line py-4 font-display text-[32px]">Account</Link>
          <p className="mt-auto text-sm text-muted">{BRAND.name} · {BRAND.tagline}</p>
        </nav>
      )}
    </div>
  );
}
