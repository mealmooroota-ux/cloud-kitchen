import Link from "next/link";
import { getSettings } from "@/lib/settings";

export async function Footer() {
  const s = await getSettings();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-12 md:flex-row md:items-start md:justify-between md:px-8">
        <div className="flex flex-col gap-2">
          <span className="font-display text-xl">{s.kitchen_name}</span>
          {s.kitchen_address && <span className="max-w-xs text-sm text-muted">{s.kitchen_address}</span>}
          {s.fssai_license && <span className="text-sm text-muted">FSSAI licence {s.fssai_license}</span>}
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-muted sm:grid-cols-3">
          <Link href="/menu" className="hover:text-ink">Menu</Link>
          <Link href="/plans" className="hover:text-ink">Meal plans</Link>
          <Link href="/orders" className="hover:text-ink">Track order</Link>
          <Link href="/legal/terms" className="hover:text-ink">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/legal/refunds" className="hover:text-ink">Refunds &amp; cancellation</Link>
          <Link href="/legal/delivery" className="hover:text-ink">Delivery policy</Link>
          <Link href="/legal/contact" className="hover:text-ink">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
