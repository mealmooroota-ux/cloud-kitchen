"use client";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import type { Order, OrderItem, OrderStatus, Payment } from "@/lib/types";
import { getBrowserClient } from "@/lib/supabase/client";
import { STATUS_META, TIMELINE } from "@/lib/order-state";
import { Banner, Button, StatusPill, VegMark } from "@/components/ui";
import { clockTime, minutesUntil, rupees } from "@/lib/format";
import { OrderScene } from "./OrderScene";

export function OrderLive({ initial, items, payment: initialPayment, history }: { initial: Order; items: OrderItem[]; payment: Payment | null; history: { to_status: OrderStatus; created_at: string }[] }) {
  const [order, setOrder] = useState(initial);
  const [payment, setPayment] = useState(initialPayment);
  const [times, setTimes] = useState(() => Object.fromEntries(history.map((h) => [h.to_status, h.created_at])) as Record<string, string>);
  const [live, setLive] = useState(false);
  const awaitingPayment = order.status === "PAYMENT_PENDING" || order.status === "PAYMENT_PROCESSING";

  // Realtime: RLS guarantees this channel only ever carries the customer's own order.
  useEffect(() => {
    const sb = getBrowserClient();
    const ch = sb.channel(`order:${order.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` }, (msg: { new: Record<string, unknown> }) => {
        const next = msg.new as unknown as Order;
        setOrder((cur) => { if (cur.status !== next.status) setTimes((t) => ({ ...t, [next.status]: new Date().toISOString() })); return { ...cur, ...next }; });
      })
      .subscribe((s: string) => setLive(s === "SUBSCRIBED"));
    return () => { sb.removeChannel(ch); };
  }, [order.id]);

  // While waiting for payment, ask our server to check with the provider (never trusts the browser).
  useEffect(() => {
    if (!awaitingPayment) return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/orders/${order.id}/status`, { cache: "no-store" });
      if (r.ok) { const j = await r.json(); setOrder((cur) => ({ ...cur, ...j })); }
    }, 5000);
    return () => clearInterval(t);
  }, [awaitingPayment, order.id]);

  const eta = order.estimated_delivery_at ?? null;
  const mins = minutesUntil(eta);
  const failed = order.status === "PAYMENT_FAILED";
  return (
    <div className="mx-auto grid max-w-[1080px] gap-8 px-4 pb-24 pt-6 md:grid-cols-[1fr_380px] md:px-8 md:pt-10">
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="tabular font-mono text-sm text-muted">Order {order.order_number}</p>
            <h1 className="font-display text-[32px] leading-tight md:text-[44px]" aria-live="polite">{STATUS_META[order.status].label}</h1>
          </div>
          <StatusPill status={order.status} />
        </div>
        {order.kind === "ORDER" && <OrderScene status={order.status} />}
        {awaitingPayment && <PaymentPanel order={order} payment={payment} onNewPayment={setPayment} />}
        {failed && <RetryPayment orderId={order.id} onNewPayment={(p) => { setPayment(p); setOrder((o) => ({ ...o, status: "PAYMENT_PENDING" })); }} />}
        {!awaitingPayment && !failed && order.kind === "ORDER" && !["CANCELLED", "REFUNDED"].includes(order.status) && (
          <div className="rounded-[20px] border border-line bg-surface p-5">
            {order.status === "DELIVERED" ? <p className="font-display text-2xl">Delivered at {clockTime(times.DELIVERED ?? order.updated_at)}. Enjoy your meal.</p> : eta ? (
              <div className="flex items-end justify-between">
                <div><p className="text-sm text-muted">Arriving around</p><p className="tabular font-mono text-[40px] font-medium leading-none">{clockTime(eta)}</p></div>
                <p className="pb-1 text-sm text-muted">{mins != null ? `in ${mins} min` : ""}</p>
              </div>
            ) : (
              <div><p className="text-sm text-muted">Ready around</p><p className="tabular font-mono text-[40px] font-medium leading-none">{clockTime(order.estimated_ready_at)}</p><p className="mt-2 text-sm text-muted">Delivery time appears once the rider is on the way.</p></div>
            )}
            <p className="mt-3 flex items-center gap-2 text-xs text-muted"><span className={`size-1.5 rounded-full ${live ? "bg-success" : "bg-line-strong"}`} />{live ? "Updating live" : "Connecting…"}</p>
          </div>
        )}
        {order.kind === "PLAN" && order.status === "PAYMENT_PAID" && <Banner tone="success" title="Your meal plan is active">Manage meals, skips and pauses in your account.</Banner>}
        {order.kind === "ORDER" && (
          <ol className="flex flex-col rounded-[20px] border border-line bg-surface px-5 py-3">
            {TIMELINE.map((s) => {
              const idx = TIMELINE.indexOf(order.status);
              const i = TIMELINE.indexOf(s);
              const state = idx === -1 ? "next" : i < idx ? "done" : i === idx ? "now" : "next";
              return (
                <li key={s} className="flex h-11 items-center gap-3.5">
                  <span className={`size-4 shrink-0 rounded-full border-2 ${state === "done" ? "border-success bg-success" : state === "now" ? "animate-pulse-dot border-brand bg-brand" : "border-line"}`} />
                  <span className={`flex-1 text-[15px] ${state === "next" ? "text-muted" : ""} ${state === "now" ? "font-semibold" : ""}`}>{STATUS_META[s].label}</span>
                  <span className="tabular font-mono text-[13px] text-muted">{times[s] ? clockTime(times[s]) : ""}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      <aside className="h-fit rounded-[20px] border border-line bg-surface p-6">
        <h2 className="mb-3 text-lg font-semibold">{order.kind === "PLAN" ? "Your plan" : "Items"}</h2>
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 text-sm">
              <span className="flex gap-2">{i.is_veg != null && <VegMark veg={i.is_veg} />}<span>{i.product_name}{i.quantity > 1 && ` ×${i.quantity}`}{i.addons.length > 0 && <span className="block text-muted">+ {i.addons.map((a) => a.name).join(", ")}</span>}</span></span>
              <span className="tabular font-mono">{rupees(i.line_total_paise, { decimals: true })}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm text-muted">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular font-mono">{rupees(order.subtotal_paise, { decimals: true })}</dd></div>
          {order.discount_paise > 0 && <div className="flex justify-between"><dt>Discount</dt><dd className="tabular font-mono">– {rupees(order.discount_paise, { decimals: true })}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular font-mono">{rupees(order.delivery_fee_paise, { decimals: true })}</dd></div>
          <div className="flex justify-between"><dt>GST</dt><dd className="tabular font-mono">{rupees(order.tax_paise, { decimals: true })}</dd></div>
          <div className="flex justify-between pt-1 text-base font-semibold text-ink"><dt>Total</dt><dd className="tabular font-mono">{rupees(order.total_paise, { decimals: true })}</dd></div>
        </dl>
        {order.delivery_address && <p className="mt-4 text-sm text-muted">Delivering to {String((order.delivery_address as Record<string, string>).label)}: {[(order.delivery_address as Record<string, string>).line1, (order.delivery_address as Record<string, string>).line2].filter(Boolean).join(", ")}</p>}
      </aside>
    </div>
  );
}

function PaymentPanel({ order, payment, onNewPayment }: { order: Order; payment: Payment | null; onNewPayment: (p: Payment) => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const isMobile = useMemo(() => typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent), []);
  useEffect(() => { if (payment?.qr_payload) QRCode.toDataURL(payment.qr_payload, { margin: 1, width: 440, color: { dark: "#1F1B16", light: "#FFFFFF" } }).then(setQr); }, [payment?.qr_payload]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const paidReturn = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("paid") === "1";
  if (!payment) return <RetryPayment orderId={order.id} onNewPayment={onNewPayment} label="Start payment" />;
  const left = payment.expires_at ? Math.max(0, Math.floor((new Date(payment.expires_at).getTime() - now) / 1000)) : null;
  const expired = left === 0;

  if (payment.provider === "phonepe") {
    return (
      <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-5">
        <p className="tabular font-mono text-3xl">{rupees(order.total_paise, { decimals: true })}</p>
        {paidReturn ? <Banner tone="info" title="Checking your payment with PhonePe">This usually takes a few seconds. Keep this page open.</Banner> : (
          <a href={payment.redirect_url ?? "#"} className="inline-flex h-14 items-center justify-center rounded-[12px] bg-brand font-semibold text-on-brand">Pay with UPI, card or netbanking</a>
        )}
        <p className="text-xs text-muted">Secure checkout by PhonePe. We confirm your payment with PhonePe directly; screenshots are not needed.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 rounded-[32px] border border-line bg-surface p-6 text-center">
      <p className="tabular font-mono text-3xl">{rupees(order.total_paise, { decimals: true })}</p>
      {expired ? <RetryPayment orderId={order.id} onNewPayment={onNewPayment} label="Get a new QR" /> : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL */}
          {qr && <img src={qr} alt={`UPI QR code for order ${order.order_number}`} width={220} height={220} className="rounded-[16px] border border-line bg-white p-2" />}
          {isMobile && payment.qr_payload && <a href={payment.qr_payload} className="inline-flex h-14 w-full items-center justify-center rounded-[12px] bg-brand font-semibold text-on-brand">Open UPI app</a>}
          <p className="text-sm text-muted">Pay exactly {rupees(order.total_paise, { decimals: true })}. The note <span className="font-mono text-ink">Order {order.order_number}</span> is filled in for you.</p>
          {left != null && <p className="tabular text-sm text-muted">QR valid for {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</p>}
        </>
      )}
      <Banner tone="info" title="Waiting for the kitchen to confirm your payment">We match it against our bank account, usually within a few minutes. This page updates by itself.</Banner>
    </div>
  );
}

function RetryPayment({ orderId, onNewPayment, label = "Try paying again" }: { orderId: string; onNewPayment: (p: Payment) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex w-full flex-col gap-3">
      {label === "Try paying again" && <Banner tone="danger" title="Payment failed">No money was taken. Try again or use another UPI app.</Banner>}
      {err && <Banner tone="danger" title={err} />}
      <Button size="lg" disabled={busy} onClick={async () => {
        setBusy(true); setErr(null);
        const r = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
        const j = await r.json().catch(() => ({}));
        setBusy(false);
        if (!r.ok) return setErr(j.error?.message ?? "Couldn’t start the payment.");
        if (j.redirectUrl) window.location.assign(j.redirectUrl);
        else onNewPayment({ provider: "manual_upi", qr_payload: j.qr, expires_at: new Date(Date.now() + 30 * 60000).toISOString() } as Payment);
      }}>{busy ? "Starting…" : label}</Button>
    </div>
  );
}
