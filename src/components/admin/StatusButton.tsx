"use client";
import { useState, useTransition } from "react";
import { transitionOrder } from "@/app/admin/actions";
import type { OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui";
import { callAction } from "@/lib/call-action";

export function StatusButton({ orderId, to, label, variant = "primary", confirmText, full = true }: { orderId: string; to: OrderStatus; label: string; variant?: "primary" | "secondary" | "ghost" | "danger"; confirmText?: string; full?: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className={full ? "w-full" : ""}>
      <Button variant={variant} className={full ? "w-full" : ""} disabled={pending} onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        start(async () => { const r = await callAction(() => transitionOrder(orderId, to)); setErr(r.ok ? null : r.error ?? "Couldn’t update the order."); });
      }}>{pending ? "Updating…" : label}</Button>
      {err && <p className="mt-1 text-xs text-danger">{err}</p>}
    </div>
  );
}
