"use client";
import Link from "next/link";
import { cart, useCart } from "./store";
import { useQuote } from "./useQuote";
import { Banner, Empty, LinkButton, VegMark } from "@/components/ui";
import { DishImage } from "@/components/ui/DishImage";
import { rupees } from "@/lib/format";

export function CartView() {
  const lines = useCart();
  const { quote, error, loading } = useQuote(lines);
  if (lines.length === 0) return <div className="mx-auto max-w-[720px] px-4 py-16"><Empty title="Your cart is empty" body="Tonight’s menu is a tap away." action={<LinkButton href="/menu">Browse the menu</LinkButton>} /></div>;
  return (
    <div className="mx-auto grid max-w-[1080px] gap-8 px-4 pb-36 pt-8 md:grid-cols-[1fr_360px] md:px-8 md:pt-12">
      <section>
        <h1 className="mb-6 font-display text-[36px] md:text-[48px]">Your cart</h1>
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center gap-4 py-4">
              <DishImage publicId={l.imageId} name="" sizes="72px" aspect="aspect-square" className="w-[72px] shrink-0 rounded-[12px]" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold"><VegMark veg={l.isVeg} />{l.name}</p>
                {l.addonNames.length > 0 && <p className="text-sm text-muted">+ {l.addonNames.join(", ")}</p>}
                <p className="tabular mt-1 font-mono text-[15px]">{rupees(l.unitPaise * l.quantity)}</p>
              </div>
              <div className="flex h-10 items-center rounded-full bg-brand-soft px-1">
                <button type="button" aria-label={`Remove one ${l.name}`} onClick={() => cart.setQty(l.key, l.quantity - 1)} className="grid size-9 place-items-center text-lg text-brand">−</button>
                <span className="tabular w-6 text-center font-mono">{l.quantity}</span>
                <button type="button" aria-label={`Add one ${l.name}`} onClick={() => cart.setQty(l.key, l.quantity + 1)} className="grid size-9 place-items-center text-lg text-brand">+</button>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/menu" className="mt-4 inline-block text-sm font-semibold text-brand">Add more dishes</Link>
      </section>
      <aside className="h-fit rounded-[20px] border border-line bg-surface p-6 md:sticky md:top-28">
        <h2 className="mb-4 text-lg font-semibold">Bill</h2>
        {error && <div className="mb-4"><Banner tone="danger" title={error} /></div>}
        <dl className="flex flex-col gap-2 text-sm text-muted" aria-busy={loading}>
          <Row k="Subtotal" v={quote?.subtotal_paise} />
          <Row k="Delivery" v={quote?.delivery_fee_paise} />
          <Row k="GST" v={quote?.tax_paise} />
          <div className="my-2 h-px bg-line" />
          <div className="flex justify-between text-base font-semibold text-ink"><dt>Total</dt><dd className="tabular font-mono">{quote ? rupees(quote.total_paise, { decimals: true }) : "…"}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-muted">Calculated by our server. Coupons can be added at checkout.</p>
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 md:static md:mt-6 md:border-0 md:p-0">
          <LinkButton href="/checkout" size="lg" className={`w-full ${error || !quote ? "pointer-events-none opacity-40" : ""}`}>Proceed to checkout</LinkButton>
        </div>
      </aside>
    </div>
  );
}
function Row({ k, v }: { k: string; v?: number }) {
  return <div className="flex justify-between"><dt>{k}</dt><dd className="tabular font-mono">{v == null ? "…" : rupees(v, { decimals: true })}</dd></div>;
}
