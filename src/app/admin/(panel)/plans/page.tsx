import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { Pill } from "@/components/ui";
import { rupees } from "@/lib/format";

export default async function Plans() {
  const { supabase } = await requireStaff(["ADMIN"]);
  const [{ data }, { data: subs }] = await Promise.all([
    supabase.from("meal_plans").select("*, meal_plan_prices(*)").order("position"),
    supabase.from("subscriptions").select("plan_id, status").in("status", ["ACTIVE", "PAUSED"]),
  ]);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Meal plans</h1><Link href="/admin/plans/new" className="rounded-[12px] bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand">New plan</Link></div>
      <div className="grid gap-4 md:grid-cols-3">
        {(data ?? []).map((p) => (
          <Link key={p.id} href={`/admin/plans/${p.id}`} className="flex flex-col gap-2 rounded-[12px] border border-line bg-surface p-5 hover:border-line-strong">
            <div className="flex items-center justify-between"><span className="font-semibold">{p.name}</span>{!p.is_active && <Pill>Hidden</Pill>}</div>
            <span className="text-sm text-muted">{p.meals.join(" · ").toLowerCase()}</span>
            <span className="text-sm">{(p.meal_plan_prices ?? []).map((x: { label: string; veg_price_paise: number }) => `${x.label} ${rupees(x.veg_price_paise)}`).join(" · ")}</span>
            <span className="text-sm text-muted">{(subs ?? []).filter((s) => s.plan_id === p.id).length} active subscribers</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
