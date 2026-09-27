"use client";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { Banner, Button, Field } from "@/components/ui";

/** Staff sign in with email + password (separate from customer phone OTP). Access also requires a staff role in the database. */
export function AdminLogin({ forbidden, next }: { forbidden: boolean; next: string }) {
  const [err, setErr] = useState<string | null>(forbidden ? "This account doesn’t have kitchen access. Ask an admin to add your role." : null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="flex flex-col gap-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr(null);
      const f = new FormData(e.currentTarget);
      const { error } = await getBrowserClient().auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
      setBusy(false);
      if (error) return setErr("Wrong email or password.");
      window.location.assign(next);
    }}>
      {err && <Banner tone="danger" title={err} />}
      <Field id="email" name="email" type="email" label="Email" autoComplete="username" required />
      <Field id="password" name="password" type="password" label="Password" autoComplete="current-password" required />
      <Button type="submit" size="lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
