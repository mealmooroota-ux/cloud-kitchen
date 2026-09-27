"use client";
import { useState, useTransition } from "react";
import { setRole } from "@/app/admin/actions";
import { callAction } from "@/lib/call-action";
export function RoleSelect({ id, role }: { id: string; role: string }) {
  const [, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      <select aria-label="Role" defaultValue={role} className="h-9 rounded-[8px] border border-line-strong bg-raised px-2" onChange={(e) => { const v = e.target.value as "CUSTOMER"; if (v !== "CUSTOMER" && !confirm(`Give this person ${v} access?`)) { e.target.value = role; return; } start(async () => { const r = await callAction(() => setRole(id, v)); setErr(r.ok ? null : r.error ?? "Couldn’t change the role."); }); }}>
        {["CUSTOMER", "KITCHEN", "DELIVERY", "ADMIN"].map((r) => <option key={r}>{r}</option>)}
      </select>{err && <span className="text-xs text-danger">{err}</span>}
    </span>
  );
}
