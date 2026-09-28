"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@/lib/types";
import { cart, toApiLines, useCart } from "@/components/cart/store";
import { useQuote } from "@/components/cart/useQuote";
import { AddressForm } from "./AddressForm";
import { Banner, Button, Empty, Field, LinkButton, TextArea } from "@/components/ui";
import { haversineKm } from "@/lib/geo";
import { rupees } from "@/lib/format";
import { normalizeIndianMobile } from "@/lib/phone";

export function CheckoutForm({ addresses, kitchen, radiusKm, open, phone: phone0 }: { addresses: Address[]; kitchen: { lat: number; lng: number }; radiusKm: number; open: boolean; phone: string }) {
  const router = useRouter();
  const lines = useCart();
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [adding, setAdding] = useState(addresses.length === 0);
  const [couponDraft, setCouponDraft] = useState("");
  const [coupon, setCoupon] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState(phone0.replace(/^\+91/, ""));
  const phoneOk = !!normalizeIndianMobile(phone);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { quote, error } = useQuote(lines, coupon);

  if (lines.length === 0) return <div className="mx-auto max-w-[720px] px-4 py-16"><Empty title="Your cart is empty" action={<LinkButton href="/menu">Browse the menu</LinkButton>} /></div>;
  const selected = addresses.find((a) => a.id === addressId);
  const outOfZone = selected ? haversineKm(kitchen, { lat: selected.latitude, lng: selected.longitude }) > radiusKm : false;

  async function place() {
    setBusy(true); setErr(null);
    const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: toApiLines(lines), addressId, couponCode: coupon || null, notes: notes || null, contactPhone: phone }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error?.message ?? "We couldn’t place your order. Try again.");
    cart.clear();
    router.push(`/orders/${j.orderId}`);
  }
  return (
    <div className="mx-auto grid max-w-[1080px] gap-8 px-4 pb-36 pt-8 md:grid-cols-[1fr_360px] md:px-8 md:pt-12">
      <section className="flex flex-col gap-6">
        <h1 className="font-display text-[36px] md:text-[48px]">Checkout</h1>
        {!open && <Banner tone="warning" title="The kitchen is closed right now">You can place your order when we open.</Banner>}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Deliver to</h2>
          {addresses.map((a) => (
            <label key={a.id} className={`flex cursor-pointer gap-3 rounded-[12px] border p-4 ${a.id === addressId ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}>
              <input type="radio" name="addr" checked={a.id === addressId} onChange={() => { setAddressId(a.id); setAdding(false); }} className="mt-1 size-5 accent-[var(--color-brand)]" />
              <span><span className="font-semibold">{a.label}</span><span className="block text-sm text-muted">{[a.line1, a.line2, a.landmark, a.city, a.postal_code].filter(Boolean).join(", ")}</span></span>
            </label>
          ))}
          {adding ? (
            <div className="rounded-[20px] border border-line bg-surface p-5">
              <AddressForm kitchen={kitchen} radiusKm={radiusKm} onSaved={(id) => { setAddressId(id); setAdding(false); router.refresh(); }} />
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="self-start text-sm font-semibold text-brand">Add a new address</button>
          )}
          {outOfZone && <Banner tone="danger" title="This address is outside our delivery area">Choose another address.</Banner>}
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Contact number</h2>
          <Field id="contact_phone" label="Mobile number for this delivery" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} error={phone && !phoneOk ? "Enter a valid 10-digit mobile number" : undefined} hint="The rider calls this number if they can’t find you. We never share it." required />
        </div>
        <TextArea id="notes" label="Cooking notes (optional)" placeholder="e.g. less spicy, no onion" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </section>
      <aside className="h-fit rounded-[20px] border border-line bg-surface p-6 md:sticky md:top-28">
        <h2 className="mb-4 text-lg font-semibold">Bill</h2>
        <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setCoupon(couponDraft.trim()); }}>
          <label htmlFor="coupon" className="sr-only">Coupon code</label>
          <input id="coupon" value={couponDraft} onChange={(e) => setCouponDraft(e.target.value.toUpperCase())} placeholder="Coupon code" className="h-11 min-w-0 flex-1 rounded-[8px] border border-line-strong bg-raised px-3" />
          <Button type="submit" variant="secondary">Apply</Button>
        </form>
        {(error || err) && <div className="mb-4"><Banner tone="danger" title={err ?? error!} /></div>}
        {quote && (
          <dl className="flex flex-col gap-2 text-sm text-muted">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular font-mono">{rupees(quote.subtotal_paise, { decimals: true })}</dd></div>
            {quote.discount_paise > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd className="tabular font-mono">– {rupees(quote.discount_paise, { decimals: true })}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular font-mono">{rupees(quote.delivery_fee_paise, { decimals: true })}</dd></div>
            <div className="flex justify-between"><dt>GST</dt><dd className="tabular font-mono">{rupees(quote.tax_paise, { decimals: true })}</dd></div>
            <div className="my-2 h-px bg-line" />
            <div className="flex justify-between text-base font-semibold text-ink"><dt>Total</dt><dd className="tabular font-mono">{rupees(quote.total_paise, { decimals: true })}</dd></div>
            <p className="mt-1 text-xs">Ready in about {quote.prep_minutes + 5} min, then delivery.</p>
          </dl>
        )}
        <div className="mobile-bottom-bar fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 md:static md:mt-6 md:border-0 md:p-0">
          <Button size="lg" className="w-full" disabled={busy || !quote || !addressId || outOfZone || !open || !phoneOk} onClick={place}>
            {busy ? "Placing order…" : quote ? `Pay ${rupees(quote.total_paise, { decimals: true })}` : "Pay"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
