import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { rupees } from "@/lib/format";

export default async function Dashboard() {
  const { supabase } = await requireStaff(["ADMIN", "KITCHEN"]);
  const start = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + "T00:00:00+05:30").toISOString();
  const [{ data: today }, { count: review }, { count: activeSubs }, { count: soldOut }] = await Promise.all([
    supabase.from("orders").select("status, total_paise, kind").gte("created_at", start),
    supabase.from("payments").select("id", { count: "exact", head: true }).in("status", ["NEEDS_REVIEW"]),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true).eq("is_available", false),
  ]);
  const paid = (today ?? []).filter((o) => !["PAYMENT_PENDING", "PAYMENT_PROCESSING", "PAYMENT_FAILED", "CANCELLED"].includes(o.status));
  const cards = [
    { k: "Paid orders today", v: String(paid.filter((o) => o.kind === "ORDER").length) },
    { k: "Revenue today", v: rupees(paid.reduce((s, o) => s + o.total_paise, 0)) },
    { k: "In the kitchen now", v: String((today ?? []).filter((o) => ["PAYMENT_PAID", "CONFIRMED", "PREPARING"].includes(o.status)).length) },
    { k: "Active meal plans", v: String(activeSubs ?? 0) },
  ];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Today</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map((c) => <div key={c.k} className="rounded-[12px] border border-line bg-surface p-4"><p className="text-sm text-muted">{c.k}</p><p className="tabular mt-1 font-mono text-2xl">{c.v}</p></div>)}</div>
      {(review ?? 0) > 0 && <Link href="/admin/payments" className="rounded-[12px] bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{review} payment{review === 1 ? "" : "s"} need review</Link>}
      {(soldOut ?? 0) > 0 && <Link href="/admin/products" className="rounded-[12px] bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">{soldOut} dish{soldOut === 1 ? " is" : "es are"} marked sold out</Link>}
      <Link href="/admin/orders" className="self-start rounded-[12px] bg-brand px-5 py-3 font-semibold text-on-brand">Open live orders</Link>
    </div>
  );
}
