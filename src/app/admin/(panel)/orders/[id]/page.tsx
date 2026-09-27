import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { StatusButton } from "@/components/admin/StatusButton";
import { RiderForm, ManualPaymentForm } from "@/components/admin/Forms";
import { StatusPill, Pill } from "@/components/ui";
import { STAFF_NEXT } from "@/lib/order-state";
import { clockTime, dateTime, rupees } from "@/lib/format";
import { displayPhone } from "@/lib/phone";
import type { OrderStatus } from "@/lib/types";

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, role } = await requireStaff();
  const { data: o } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!o) notFound();
  const [{ data: items }, { data: pays }, { data: hist }, { data: del }, { data: cust }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("payments").select("*").eq("order_id", id).order("created_at", { ascending: false }),
    supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at"),
    supabase.from("delivery").select("*").eq("order_id", id).maybeSingle(),
    supabase.from("profiles").select("full_name, phone").eq("id", o.user_id).maybeSingle(),
  ]);
  const next = STAFF_NEXT[o.status as OrderStatus];
  const addr = (o.delivery_address ?? {}) as Record<string, string>;
  const pay = pays?.[0];
  const canCancel = ["PAYMENT_PAID", "CONFIRMED", "PREPARING"].includes(o.status) && role !== "DELIVERY";
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3"><h1 className="tabular font-mono text-2xl">{o.order_number}</h1><StatusPill status={o.status} /><span className="text-sm text-muted">Placed {dateTime(o.created_at)}</span></div>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-5">
          <section className="rounded-[12px] border border-line bg-surface p-5">
            <h2 className="mb-3 font-semibold">Items (as ordered)</h2>
            <ul className="divide-y divide-line text-sm">{(items ?? []).map((i) => <li key={i.id} className="flex justify-between py-2"><span><span className="tabular font-mono text-brand">{i.quantity}×</span> {i.product_name}{i.addons?.length ? <span className="text-muted"> + {i.addons.map((a: { name: string }) => a.name).join(", ")}</span> : null}</span><span className="tabular font-mono">{rupees(i.line_total_paise, { decimals: true })}</span></li>)}</ul>
            <dl className="ml-auto mt-3 flex max-w-xs flex-col gap-1 text-sm">
              {[["Subtotal", o.subtotal_paise], ["Discount", -o.discount_paise], ["Delivery", o.delivery_fee_paise], ["GST", o.tax_paise]].map(([k, v]) => <div key={k as string} className="flex justify-between text-muted"><dt>{k}</dt><dd className="tabular font-mono">{rupees(v as number, { decimals: true })}</dd></div>)}
              <div className="flex justify-between border-t border-line pt-1 font-semibold"><dt>Total</dt><dd className="tabular font-mono">{rupees(o.total_paise, { decimals: true })}</dd></div>
            </dl>
            {o.notes && <p className="mt-3 rounded-[8px] bg-warning-soft px-3 py-2 text-sm text-warning">Customer note: {o.notes}</p>}
          </section>
          <section className="rounded-[12px] border border-line bg-surface p-5">
            <h2 className="mb-3 font-semibold">Status history</h2>
            <ol className="flex flex-col text-sm">{(hist ?? []).map((h) => <li key={h.id} className="flex justify-between border-b border-line py-2 last:border-0"><span className="tabular font-mono">{h.to_status}</span><span className="text-muted">{h.source}{h.note ? ` · ${h.note}` : ""}</span><span className="tabular font-mono text-muted">{clockTime(h.created_at)}</span></li>)}</ol>
          </section>
        </div>
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3 rounded-[12px] border border-line bg-surface p-5">
            <h2 className="font-semibold">Next step</h2>
            {next && (role !== "DELIVERY" || ["OUT_FOR_DELIVERY", "DELIVERED"].includes(next.to)) ? <StatusButton orderId={o.id} to={next.to} label={next.label} /> : <p className="text-sm text-muted">{o.status.startsWith("PAYMENT") ? "Waiting for payment confirmation." : "No further steps."}</p>}
            {canCancel && <StatusButton orderId={o.id} to="CANCELLED" label="Cancel order" variant="ghost" confirmText="Cancel this order? If it was paid, refund it from your payment dashboard, then mark it refunded here." />}
            {o.status === "CANCELLED" && role === "ADMIN" && o.payment_status === "PAID" && <StatusButton orderId={o.id} to="REFUNDED" label="Mark refunded" variant="secondary" confirmText="Only mark refunded after the money has been returned." />}
            <p className="text-xs text-muted">Only allowed transitions are shown. The database re-checks every change.</p>
          </section>
          <section className="flex flex-col gap-2 rounded-[12px] border border-line bg-surface p-5 text-sm">
            <h2 className="font-semibold">Payment</h2>
            {pay ? <>
              <div className="flex items-center gap-2"><Pill tone={pay.status === "PAID" ? "success" : pay.status === "NEEDS_REVIEW" || pay.status === "FAILED" ? "danger" : "warning"}>{pay.status}</Pill><span className="text-muted">{pay.provider}</span></div>
              <p>Reference <span className="tabular font-mono">{pay.provider_order_id}</span></p>
              {pay.transaction_reference && <p>UTR / txn <span className="tabular font-mono">{pay.transaction_reference}</span></p>}
              <p>Amount <span className="tabular font-mono">{rupees(pay.amount_paise, { decimals: true })}</span></p>
              {pay.provider === "manual_upi" && ["PENDING", "NEEDS_REVIEW"].includes(pay.status) && role === "ADMIN" && <ManualPaymentForm paymentId={pay.id} amount={pay.amount_paise} />}
            </> : <p className="text-muted">No payment started.</p>}
          </section>
          <section className="flex flex-col gap-2 rounded-[12px] border border-line bg-surface p-5 text-sm">
            <h2 className="font-semibold">Delivery</h2>
            <p>{cust?.full_name || "Customer"}{(o.contact_phone || cust?.phone) && <> · <a href={`tel:${o.contact_phone || cust?.phone}`} className="tabular font-mono font-semibold text-brand">{displayPhone(o.contact_phone || cust?.phone)}</a></>}</p>
            <p className="text-muted">{[addr.line1, addr.line2, addr.landmark, addr.city, addr.postal_code].filter(Boolean).join(", ")}</p>
            {o.latitude && <a className="font-semibold text-brand" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`}>Open route in Maps</a>}
            <p>ETA {o.estimated_delivery_at ? clockTime(o.estimated_delivery_at) : "—"}{o.distance_m ? ` · ${(o.distance_m / 1000).toFixed(1)} km` : ""}{o.eta_is_estimate ? " (routing not configured)" : ""}</p>
            {role !== "DELIVERY" && <RiderForm orderId={o.id} name={del?.rider_name ?? ""} phone={del?.rider_phone ?? ""} />}
          </section>
        </div>
      </div>
    </div>
  );
}
