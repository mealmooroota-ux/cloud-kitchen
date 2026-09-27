"use client";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { Banner, Button, Field } from "@/components/ui";

export function ResetPassword() {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="flex flex-col gap-5" onSubmit={async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const p1 = String(f.get("password")), p2 = String(f.get("confirm"));
      if (p1.length < 8) return setErr("Use at least 8 characters.");
      if (p1 !== p2) return setErr("The two passwords don’t match.");
      setBusy(true); setErr(null);
      const { error } = await getBrowserClient().auth.updateUser({ password: p1 });
      setBusy(false);
      if (error) return setErr("This reset link has expired. Request a new one from the sign-in page.");
      window.location.assign("/account");
    }}>
      <h1 className="font-display text-[34px] leading-tight">Choose a new password</h1>
      {err && <Banner tone="danger" title={err} />}
      <Field id="password" name="password" type="password" label="New password" autoComplete="new-password" minLength={8} required />
      <Field id="confirm" name="confirm" type="password" label="Repeat new password" autoComplete="new-password" minLength={8} required />
      <Button type="submit" size="lg" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
    </form>
  );
}
