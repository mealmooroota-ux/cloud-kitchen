import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { LiveRefresh } from "@/components/admin/LiveRefresh";
import { StatusButton } from "@/components/admin/StatusButton";
import { STAFF_NEXT } from "@/lib/order-state";
import { minutesUntil } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const COLS: { title: string; statuses: OrderStatus[] }[] = [
  { title: "New · paid", statuses: ["PAYMENT_PAID"] },
  { title: "Preparing", statuses: ["CONFIRMED", "PREPARING"] },
  { title: "Ready for pickup", statuses: ["READY_FOR_PICKUP"] },
  { title: "Out for delivery", statuses: ["OUT_FOR_DELIVERY"] },
];

export default async function OrdersBoard() {
  const { supabase, role } = await requireStaff();
  // Only payment-verified orders reach the kitchen.
  const { data } = await supabase.from("orders").select("id, order_number, status, created_at, estimated_ready_at, estimated_delivery_at, prep_minutes, notes, kind, order_items(product_name, quantity, addons)")
    .eq("kind", "ORDER").in("status", COLS.flatMap((c) => c.statuses)).order("created_at");
  const orders = data ?? [];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Live orders</h1><LiveRefresh /></div>
      <div className="grid gap-5 lg:grid-cols-4">
        {COLS.map((c) => {
          const list = orders.filter((o) => c.statuses.includes(o.status as OrderStatus));
          return (
            <section key={c.title} className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 border-b-2 border-line pb-2 font-semibold">{c.title}<span className="tabular font-mono text-sm text-muted">{list.length}</span></h2>
              {list.length === 0 && <p className="text-sm text-muted">Nothing here.</p>}
              {list.map((o) => {
                const next = STAFF_NEXT[o.status as OrderStatus];
                const readyIn = minutesUntil(o.estimated_ready_at);
                const late = o.status !== "OUT_FOR_DELIVERY" && o.estimated_ready_at && new Date(o.estimated_ready_at).getTime() < Date.now();
                const allowed = next && (role !== "DELIVERY" || ["OUT_FOR_DELIVERY", "DELIVERED"].includes(next.to));
                return (
                  <article key={o.id} className="flex flex-col gap-3 rounded-[12px] border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(31,27,22,.06)]">
                    <div className="flex items-center justify-between">
                      <Link href={`/admin/orders/${o.id}`} className="tabular font-mono text-sm font-medium hover:underline">{o.order_number}</Link>
                      <span className={`tabular font-mono text-xs ${late ? "font-semibold text-warning" : "text-muted"}`}>{late ? "Late" : readyIn != null && o.status !== "OUT_FOR_DELIVERY" ? `ready in ${readyIn}m` : ""}</span>
                    </div>
                    <ul className="flex flex-col gap-1 text-sm">{(o.order_items as { product_name: string; quantity: number; addons: { name: string }[] }[]).map((i, n) => <li key={n}><span className="tabular font-mono text-brand">{i.quantity}×</span> {i.product_name}{i.addons?.length ? <span className="text-muted"> + {i.addons.map((a) => a.name).join(", ")}</span> : null}</li>)}</ul>
                    {o.notes && <p className="rounded-[8px] bg-warning-soft px-2.5 py-1.5 text-xs text-warning">Note: {o.notes}</p>}
                    {o.status === "CONFIRMED" ? <StatusButton orderId={o.id} to="PREPARING" label="Start preparing" /> : allowed && next ? <StatusButton orderId={o.id} to={next.to} label={next.label} variant={next.to === "DELIVERED" ? "secondary" : "primary"} /> : null}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
