"use client";
import { useOptimistic, useState, useTransition } from "react";
import { setKitchenOpen } from "@/app/admin/actions";
import { callAction } from "@/lib/call-action";

export function KitchenToggle({ open, canToggle }: { open: boolean; canToggle: boolean }) {
  const [state, setState] = useOptimistic(open);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      {err && <p role="alert" className="max-w-md text-right text-xs text-danger">{err}</p>}
      <button type="button" role="switch" aria-checked={state} disabled={!canToggle || pending}
        onClick={() => start(async () => { setErr(null); setState(!state); const r = await callAction(() => setKitchenOpen(!state)); if (!r.ok) setErr(r.error ?? "Couldn’t change the kitchen status."); })}
        className="flex h-10 items-center gap-2.5 rounded-full border border-line-strong bg-surface pl-1.5 pr-4 text-sm font-semibold disabled:opacity-60">
        <span className={`relative h-[22px] w-9 rounded-full transition-colors ${state ? "bg-success" : "bg-line-strong"}`}><span className={`absolute top-[3px] size-4 rounded-full bg-white transition-all ${state ? "right-[3px]" : "left-[3px]"}`} /></span>
        {state ? "Kitchen open" : "Kitchen closed"}
      </button>
    </div>
  );
}
