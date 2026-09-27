"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@/lib/types";
import { deleteAddress, makeDefaultAddress } from "@/app/account/actions";
import { AddressForm } from "./AddressForm";
import { callAction } from "@/lib/call-action";
import { Pill } from "@/components/ui";

export function AddressBook({ addresses, kitchen, radiusKm }: { addresses: Address[]; kitchen: { lat: number; lng: number }; radiusKm: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(addresses.length ? null : "new");
  const [, start] = useTransition();
  const done = () => { setEditing(null); router.refresh(); };
  return (
    <div className="flex flex-col gap-3">
      {addresses.map((a) => editing === a.id ? (
        <div key={a.id} className="rounded-[20px] border border-line bg-surface p-5"><AddressForm kitchen={kitchen} radiusKm={radiusKm} initial={a} onSaved={done} /></div>
      ) : (
        <div key={a.id} className="flex flex-col gap-2 rounded-[20px] border border-line bg-surface p-4">
          <div className="flex items-center gap-2"><span className="font-semibold">{a.label}</span>{a.is_default && <Pill>Default</Pill>}</div>
          <p className="text-sm text-muted">{[a.line1, a.line2, a.landmark, a.city, a.postal_code].filter(Boolean).join(", ")}</p>
          <div className="flex gap-4 text-sm font-semibold text-brand">
            <button type="button" onClick={() => setEditing(a.id)}>Edit</button>
            {!a.is_default && <button type="button" onClick={() => start(async () => { await callAction(() => makeDefaultAddress(a.id)); router.refresh(); })}>Make default</button>}
            <button type="button" className="text-danger" onClick={() => { if (confirm(`Delete ${a.label}?`)) start(async () => { await callAction(() => deleteAddress(a.id)); router.refresh(); }); }}>Delete</button>
          </div>
        </div>
      ))}
      {editing === "new" ? <div className="rounded-[20px] border border-line bg-surface p-5"><AddressForm kitchen={kitchen} radiusKm={radiusKm} onSaved={done} /></div>
        : <button type="button" onClick={() => setEditing("new")} className="self-start text-sm font-semibold text-brand">Add a new address</button>}
    </div>
  );
}
