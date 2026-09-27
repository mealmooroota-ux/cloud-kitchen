"use client";
import { useState, useTransition } from "react";
import { assignRider, confirmManualPayment, markPaymentFailed } from "@/app/admin/actions";
import { Button } from "@/components/ui";

export function useAction() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (f: () => Promise<{ ok: boolean; error?: string }>, okText = "Saved") => start(async () => { const r = await f(); setMsg(r.ok ? { ok: true, text: okText } : { ok: false, text: r.error ?? "Something went wrong." }); });
  const note = msg && <p role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>;
  return { pending, run, note };
}
const input = "h-10 rounded-[8px] border border-line-strong bg-raised px-3 text-sm";

export function ManualPaymentForm({ paymentId, amount }: { paymentId: string; amount: number }) {
  const { pending, run, note } = useAction();
  return (
    <form className="mt-2 flex flex-col gap-2 rounded-[8px] bg-raised p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); if (!confirm("Confirm you can SEE this credit in your bank / PhonePe Business app?")) return; run(() => confirmManualPayment(paymentId, f), "Payment confirmed"); }}>
      <p className="text-xs text-muted">Open your bank or PhonePe Business app, find the credit with this order’s note, then enter its UTR. Never confirm from a customer screenshot.</p>
      <label className="text-xs font-semibold" htmlFor={`utr-${paymentId}`}>UTR / transaction ID</label>
      <input id={`utr-${paymentId}`} name="utr" required className={input} />
      <label className="text-xs font-semibold" htmlFor={`amt-${paymentId}`}>Amount received (₹)</label>
      <input id={`amt-${paymentId}`} name="amount" required inputMode="decimal" defaultValue={(amount / 100).toFixed(2)} className={input} />
      <div className="flex gap-2"><Button type="submit" size="sm" disabled={pending}>Confirm received</Button><Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => confirm("Mark this payment as not received?") && run(() => markPaymentFailed(paymentId), "Marked failed")}>Not received</Button></div>
      {note}
    </form>
  );
}
export function RiderForm({ orderId, name, phone }: { orderId: string; name: string; phone: string }) {
  const { pending, run, note } = useAction();
  return (
    <form className="mt-2 flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(() => assignRider(orderId, f)); }}>
      <div className="flex gap-2"><input aria-label="Rider name" name="rider_name" defaultValue={name} placeholder="Rider name" className={`${input} min-w-0 flex-1`} /><input aria-label="Rider phone" name="rider_phone" defaultValue={phone} placeholder="Phone" className={`${input} w-32`} /></div>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>Save rider</Button>{note}
    </form>
  );
}
