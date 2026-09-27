"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPaused, skipMeal, unskipMeal } from "@/app/account/actions";
import { Banner, Button } from "@/components/ui";
import { callAction } from "@/lib/call-action";

const L: Record<string, string> = { BREAKFAST: "Breakfast", LUNCH: "Lunch", DINNER: "Dinner", SNACK: "Snack" };
export function PlanDays({ subscriptionId, status, allowPause, days, slots }: { subscriptionId: string; status: string; allowPause: boolean; slots: Record<string, string>; days: { date: string; meals: { meal: string; dish: string; skipped: boolean }[] }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const run = (f: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await callAction(f); if (!r.ok) setErr(r.error ?? "Something went wrong."); else { setErr(null); router.refresh(); } });
  return (
    <div className="flex flex-col gap-5">
      {err && <Banner tone="danger" title={err} />}
      {days.map((d) => (
        <section key={d.date} className="flex flex-col gap-2">
          <h2 className="font-semibold">{new Date(d.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</h2>
          {d.meals.map((m) => (
            <div key={m.meal} className={`flex items-center justify-between gap-3 rounded-[16px] border border-line bg-surface p-4 ${m.skipped ? "opacity-60" : ""}`}>
              <div><p className="text-xs font-semibold text-muted">{L[m.meal]} · {slots[m.meal] ?? ""}</p><p className="font-semibold">{m.skipped ? "Skipped" : m.dish}</p></div>
              {status === "ACTIVE" && <button type="button" disabled={pending} className="text-sm font-semibold text-brand" onClick={() => run(() => (m.skipped ? unskipMeal(subscriptionId, d.date, m.meal) : skipMeal(subscriptionId, d.date, m.meal)))}>{m.skipped ? "Undo skip" : "Skip"}</button>}
            </div>
          ))}
        </section>
      ))}
      {allowPause && (status === "ACTIVE" || status === "PAUSED") && (
        <Button variant="secondary" size="lg" disabled={pending} onClick={() => run(() => setPaused(subscriptionId, status === "ACTIVE"))}>{status === "ACTIVE" ? "Pause plan" : "Resume plan"}</Button>
      )}
      <p className="text-center text-xs text-muted">Skip or change before 9 PM the night before. Paused days are added to the end of your plan.</p>
    </div>
  );
}
