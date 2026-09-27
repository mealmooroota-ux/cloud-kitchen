"use client";
import { useOptimistic, useTransition } from "react";
import { setKitchenOpen } from "@/app/admin/actions";

export function KitchenToggle({ open, canToggle }: { open: boolean; canToggle: boolean }) {
  const [state, setState] = useOptimistic(open);
  const [, start] = useTransition();
  return (
    <button type="button" role="switch" aria-checked={state} disabled={!canToggle}
      onClick={() => start(async () => { setState(!state); await setKitchenOpen(!state); })}
      className="flex h-10 items-center gap-2.5 rounded-full border border-line-strong bg-surface pl-1.5 pr-4 text-sm font-semibold disabled:opacity-60">
      <span className={`relative h-[22px] w-9 rounded-full ${state ? "bg-success" : "bg-line-strong"}`}><span className={`absolute top-[3px] size-4 rounded-full bg-white transition-all ${state ? "right-[3px]" : "left-[3px]"}`} /></span>
      {state ? "Kitchen open" : "Kitchen closed"}
    </button>
  );
}
