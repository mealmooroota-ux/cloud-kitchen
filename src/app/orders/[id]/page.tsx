import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { OrderLive } from "@/components/order/OrderLive";
import { requireUser } from "@/lib/auth";
import type { Order, OrderItem, Payment } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser(`/orders/${id}`);
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();
  const [{ data: items }, { data: pay }, { data: hist }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("payments").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("order_status_history").select("to_status, created_at").eq("order_id", id).order("created_at"),
  ]);
  return (
    <Shell cartBar={false}>
      <OrderLive initial={order as Order} items={(items ?? []) as OrderItem[]} payment={(pay ?? null) as Payment | null} history={hist ?? []} />
    </Shell>
  );
}
