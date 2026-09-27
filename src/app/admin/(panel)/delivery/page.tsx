import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { StatusButton } from "@/components/admin/StatusButton";
import { StatusPill } from "@/components/ui";
import { clockTime } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export default async function Delivery() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("orders").select("id, order_number, status, delivery_address, latitude, longitude, estimated_delivery_at, distance_m, delivery(rider_name, rider_phone)").in("status", ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"]).order("created_at");
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Delivery</h1>
      {(data ?? []).length === 0 && <p className="text-sm text-muted">No orders waiting for delivery.</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((o) => {
          const a = (o.delivery_address ?? {}) as Record<string, string>;
          const d = (Array.isArray(o.delivery) ? o.delivery[0] : o.delivery) as { rider_name?: string } | null;
          return (
            <article key={o.id} className="flex flex-col gap-2 rounded-[12px] border border-line bg-surface p-4 text-sm">
              <div className="flex items-center justify-between"><Link href={`/admin/orders/${o.id}`} className="tabular font-mono font-medium">{o.order_number}</Link><StatusPill status={o.status as OrderStatus} /></div>
              <p className="text-muted">{[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}</p>
              <p>Rider: {d?.rider_name || "not assigned"} · ETA {o.estimated_delivery_at ? clockTime(o.estimated_delivery_at) : "—"}{o.distance_m ? ` · ${(o.distance_m / 1000).toFixed(1)} km` : ""}</p>
              {o.latitude && <a className="font-semibold text-brand" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}&travelmode=two-wheeler`}>Navigate</a>}
              <StatusButton orderId={o.id} to={o.status === "READY_FOR_PICKUP" ? "OUT_FOR_DELIVERY" : "DELIVERED"} label={o.status === "READY_FOR_PICKUP" ? "Picked up" : "Delivered"} />
            </article>
          );
        })}
      </div>
    </div>
  );
}
