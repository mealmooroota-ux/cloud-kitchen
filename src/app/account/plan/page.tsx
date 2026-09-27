import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { Empty, LinkButton, Pill } from "@/components/ui";
import { PlanDays } from "@/components/site/PlanDays";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My meal plan", robots: { index: false } };

export default async function MyPlan() {
  const { supabase } = await requireUser("/account/plan");
  const { data: subs } = await supabase.from("subscriptions").select("*, meal_plans(id, name, allow_pause, skip_cutoff_hours)").in("status", ["ACTIVE", "PAUSED", "PENDING_PAYMENT"]).order("created_at", { ascending: false });
  if (!subs?.length) return <Shell><div className="mx-auto max-w-[720px] px-4 py-16"><Empty title="No meal plan yet" body="Get breakfast, lunch and dinner delivered every day." action={<LinkButton href="/plans">See meal plans</LinkButton>} /></div></Shell>;
  const sub = subs[0];
  const plan = sub.meal_plans as { id: string; name: string; allow_pause: boolean };
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }, (_, i) => new Date(new Date(today).getTime() + i * 86400e3).toISOString().slice(0, 10)).filter((d) => d >= sub.start_date && d <= sub.end_date);
  const [{ data: skips }, { data: menu }] = await Promise.all([
    supabase.from("subscription_skips").select("date, meal").eq("subscription_id", sub.id).gte("date", today),
    supabase.from("plan_menu").select("week, weekday, meal, custom_name, products(name)").eq("plan_id", plan.id),
  ]);
  const start = new Date(sub.start_date).getTime();
  const dishFor = (d: string, meal: string) => {
    const idx = Math.floor((new Date(d).getTime() - start) / 86400e3);
    const week = (Math.floor(idx / 7) % 4) + 1;
    const weekday = (new Date(d).getUTCDay() + 6) % 7;
    const r = (menu ?? []).find((m) => m.week === week && m.weekday === weekday && m.meal === meal) ?? (menu ?? []).find((m) => m.week === 1 && m.weekday === weekday && m.meal === meal);
    return r?.custom_name ?? (r?.products as unknown as { name: string } | null)?.name ?? "Chef’s choice";
  };
  const total = Math.round((new Date(sub.end_date).getTime() - start) / 86400e3) + 1;
  const dayN = Math.min(total, Math.max(0, Math.floor((new Date(today).getTime() - start) / 86400e3) + 1));
  return (
    <Shell>
      <div className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 pb-24 pt-8 md:pt-12">
        <h1 className="font-display text-[36px] md:text-[48px]">My meal plan</h1>
        <div className="flex flex-col gap-3 rounded-[20px] bg-ink p-6 text-ground">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#E2B85A]">{plan.name} · {sub.diet === "VEG" ? "veg" : "non-veg"}</p>{sub.status !== "ACTIVE" && <Pill tone={sub.status === "PAUSED" ? "warning" : "info"}>{sub.status === "PAUSED" ? "Paused" : "Waiting for payment"}</Pill>}</div>
          <p className="font-display text-[30px]">{dayN > 0 ? `Day ${dayN} of ${total}` : `Starts ${new Date(sub.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}</p>
          <div className="h-1.5 rounded-full bg-white/20"><div className="h-1.5 rounded-full bg-[#E2B85A]" style={{ width: `${(dayN / total) * 100}%` }} /></div>
          <p className="text-sm text-[#CFC5B6]">Ends {new Date(sub.end_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
        </div>
        <PlanDays subscriptionId={sub.id} status={sub.status} allowPause={plan.allow_pause}
          days={days.map((d) => ({ date: d, meals: (sub.meals as string[]).map((m) => ({ meal: m, dish: dishFor(d, m), skipped: !!skips?.find((s) => s.date === d && s.meal === m) })) }))} slots={(sub.slots ?? {}) as Record<string, string>} />
      </div>
    </Shell>
  );
}
