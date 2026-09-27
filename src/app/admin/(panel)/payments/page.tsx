import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { ManualPaymentForm } from "@/components/admin/Forms";
import { Pill } from "@/components/ui";
import { dateTime, rupees } from "@/lib/format";

export default async function Payments({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = "open" } = await searchParams;
  const { supabase } = await requireStaff(["ADMIN"]);
  let q = supabase.from("payments").select("*, orders(order_number, id, status)").order("created_at", { ascending: false }).limit(100);
  if (f === "open") q = q.in("status", ["PENDING", "NEEDS_REVIEW"]);
  const { data } = await q;
  const tabs = [["open", "Needs action"], ["all", "All payments"]];
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Payments</h1>
      <p className="max-w-3xl text-sm text-muted">PhonePe payments are confirmed automatically by webhook and status checks. Manual UPI payments (your own UPI ID) must be matched against your bank or PhonePe Business app and confirmed here with the UTR. Every confirmation is logged.</p>
      <div className="flex gap-2">{tabs.map(([k, l]) => <Link key={k} href={`/admin/payments?f=${k}`} className={`h-9 rounded-full border px-4 py-1.5 text-sm font-semibold ${f === k ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}>{l}</Link>)}</div>
      <div className="flex flex-col gap-3">
        {(data ?? []).length === 0 && <p className="text-sm text-muted">Nothing to review.</p>}
        {(data ?? []).map((p) => {
          const o = p.orders as { order_number: string; id: string; status: string };
          return (
            <div key={p.id} className="grid gap-3 rounded-[12px] border border-line bg-surface p-4 md:grid-cols-[1fr_360px]">
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/orders/${o.id}`} className="tabular font-mono font-medium hover:underline">{o.order_number}</Link><Pill tone={p.status === "PAID" ? "success" : p.status === "PENDING" ? "warning" : "danger"}>{p.status}</Pill><span className="text-muted">{p.provider}</span></div>
                <p className="tabular font-mono text-lg">{rupees(p.amount_paise, { decimals: true })}</p>
                <p className="text-muted">Ref {p.provider_order_id} · {dateTime(p.created_at)}</p>
                {p.transaction_reference && <p>UTR {p.transaction_reference}</p>}
              </div>
              {p.provider === "manual_upi" && ["PENDING", "NEEDS_REVIEW"].includes(p.status) && <ManualPaymentForm paymentId={p.id} amount={p.amount_paise} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
