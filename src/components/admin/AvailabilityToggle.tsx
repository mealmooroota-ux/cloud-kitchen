"use client";
import { useOptimistic, useTransition } from "react";
import { setAvailability } from "@/app/admin/actions";
export function AvailabilityToggle({ id, available }: { id: string; available: boolean }) {
  const [on, set] = useOptimistic(available);
  const [, start] = useTransition();
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => start(async () => { set(!on); await setAvailability(id, !on); })} className="flex items-center gap-2 text-sm">
      <span className={`relative h-[22px] w-9 rounded-full ${on ? "bg-success" : "bg-line-strong"}`}><span className={`absolute top-[3px] size-4 rounded-full bg-white transition-all ${on ? "right-[3px]" : "left-[3px]"}`} /></span>{on ? "On" : "Sold out"}
    </button>
  );
}
