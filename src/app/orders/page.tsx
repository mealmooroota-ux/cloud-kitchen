import Link from "next/link";
import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { Empty, LinkButton, StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { dateTime, rupees } from "@/lib/format";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your orders", robots: { index: false } };

export default async function OrdersPage() {
  const { supabase } = await requireUser("/orders");
  const { data } = await supabase.from("orders").select("*, order_items(product_name, quantity)").order("created_at", { ascending: false }).limit(50);
  const orders = (data ?? []) as (Order & { order_items: { product_name: string; quantity: number }[] })[];
  return (
    <Shell>
      <div className="mx-auto max-w-[760px] px-4 pb-24 pt-8 md:pt-12">
        <h1 className="mb-6 font-display text-[36px] md:text-[48px]">Your orders</h1>
        {orders.length === 0 ? <Empty title="No orders yet" body="Your orders and meal plans will show up here." action={<LinkButton href="/menu">Browse the menu</LinkButton>} /> : (
          <ul className="flex flex-col gap-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex flex-col gap-2 rounded-[20px] border border-line bg-surface p-4 hover:border-line-strong">
                  <span className="tabular font-mono text-[13px] text-muted">{o.order_number} · {dateTime(o.created_at)}</span>
                  <span className="font-semibold">{o.order_items.map((i) => (i.quantity > 1 ? `${i.product_name} ×${i.quantity}` : i.product_name)).join(", ")}</span>
                  <span className="flex items-center justify-between"><StatusPill status={o.status} /><span className="tabular font-mono">{rupees(o.total_paise, { decimals: true })}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
