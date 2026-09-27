import Link from "next/link";
import { CartButton } from "@/components/cart/CartButton";
import { Wordmark } from "./Wordmark";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/plans", label: "Meal plans" },
  { href: "/kitchen", label: "Our kitchen" },
  { href: "/experience", label: "Experience" },
  { href: "/orders", label: "Track order" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ground/90 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 md:h-20 md:px-8">
        <Wordmark />
        <nav aria-label="Main" className="hidden items-center gap-9 text-sm font-medium text-muted md:flex">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-ink">{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/account" className="grid size-11 place-items-center rounded-[12px] hover:bg-raised" aria-label="Account">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>
          </Link>
          <CartButton />
          <MobileNav items={NAV} />
        </div>
      </div>
    </header>
  );
}
