"use client";
import { useOptimistic, useState, useTransition } from "react";
import { setAvailability } from "@/app/admin/actions";
import { callAction } from "@/lib/call-action";

export function AvailabilityToggle({ id, available }: { id: string; available: boolean }) {
  const [on, set] = useOptimistic(available);
  const [, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="flex flex-col gap-1">
      <button type="button" role="switch" aria-checked={on} onClick={() => start(async () => { setErr(null); set(!on); const r = await callAction(() => setAvailability(id, !on)); if (!r.ok) setErr(r.error ?? "Couldn’t update."); })} className="flex items-center gap-2 text-sm">
        <span className={`relative h-[22px] w-9 rounded-full ${on ? "bg-success" : "bg-line-strong"}`}><span className={`absolute top-[3px] size-4 rounded-full bg-white transition-all ${on ? "right-[3px]" : "left-[3px]"}`} /></span>{on ? "On" : "Sold out"}
      </button>
      {err && <span className="max-w-[220px] text-xs text-danger">{err}</span>}
    </span>
  );
}
