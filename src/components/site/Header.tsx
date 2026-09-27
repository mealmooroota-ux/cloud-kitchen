import Link from "next/link";
import { CartButton } from "@/components/cart/CartButton";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ground/90 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 md:h-20 md:px-8">
        <Link href="/" className="font-display text-[22px] md:text-[26px]">Cloud Kitchen</Link>
        <nav aria-label="Main" className="hidden items-center gap-9 text-sm font-medium text-muted md:flex">
          <Link href="/menu" className="hover:text-ink">Menu</Link>
          <Link href="/plans" className="hover:text-ink">Meal plans</Link>
          <Link href="/#layers" className="hover:text-ink">Our kitchen</Link>
          <Link href="/orders" className="hover:text-ink">Track order</Link>
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/menu" className="grid size-11 place-items-center rounded-[12px] hover:bg-raised md:hidden" aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
          </Link>
          <Link href="/account" className="grid size-11 place-items-center rounded-[12px] hover:bg-raised" aria-label="Account">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
