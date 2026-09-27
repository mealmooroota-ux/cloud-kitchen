import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { BRAND } from "@/lib/brand";

export async function Footer() {
  const s = await getSettings();
  const cols = [
    { title: "Eat", links: [["/menu", "Today’s menu"], ["/plans", "Meal plans"], ["/menu?tag=Healthy", "Healthy & light"], ["/orders", "Track an order"]] },
    { title: "MOOROOTA", links: [["/kitchen", "Our kitchen"], ["/#layers", "Why we’re different"], ["/legal/contact", "Contact"], ["/account", "Your account"]] },
    { title: "Policies", links: [["/legal/terms", "Terms"], ["/legal/privacy", "Privacy"], ["/legal/refunds", "Refunds & cancellation"], ["/legal/delivery", "Delivery policy"]] },
  ];
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-4 py-16 md:grid-cols-[1.3fr_2fr] md:px-8">
        <div className="flex flex-col gap-4">
          <p className="font-display text-[34px] font-semibold tracking-[0.08em]">{BRAND.name}</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{BRAND.tagline}</p>
          <p className="max-w-sm text-sm leading-6 text-muted">Homemade, healthy Indian meals, cooked to order in small batches in {BRAND.city}.</p>
          <dl className="mt-2 flex flex-col gap-1 text-sm text-muted">
            <div>Open {s.open_time.slice(0, 5)} – {s.close_time.slice(0, 5)}, every day</div>
            {s.kitchen_address && <div>{s.kitchen_address}</div>}
            {s.support_phone && <div>{s.support_phone}</div>}
            {s.fssai_license && <div>FSSAI licence {s.fssai_license}</div>}
          </dl>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-3 text-sm">
              <p className="font-semibold">{c.title}</p>
              {c.links.map(([href, label]) => <Link key={href} href={href} className="text-muted hover:text-ink">{label}</Link>)}
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-line"><p className="mx-auto max-w-[1320px] px-4 py-6 text-xs text-muted md:px-8">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p></div>
    </footer>
  );
}
