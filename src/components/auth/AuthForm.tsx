"use client";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { Banner, Button, Field } from "@/components/ui";

type Mode = "signin" | "signup" | "forgot";

/** Never leave the button spinning: give up after 20 s with a clear message. */
function withTimeout<T>(p: Promise<T>, ms = 20000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

function explain(message = "", status?: number) {
  const m = message.toLowerCase();
  if (m === "timeout" || status === 504) return "The sign-in service is taking too long. This usually means the email settings in Supabase need attention. Try again in a minute.";
  if (m.includes("error sending") || m.includes("smtp")) return "We couldn’t send the email. The site’s email settings need attention; please contact us.";
  if (m.includes("invalid login credentials")) return "That email and password don’t match. Try again or reset your password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the link we sent.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("password should be") || m.includes("weak")) return "Use a stronger password: at least 8 characters.";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) return "Google sign-in isn’t switched on yet. Use email and password for now.";
  if (status === 429 || m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("fetch") || m.includes("network")) return "We couldn’t reach the sign-in service. Check your connection. If it keeps happening, the site’s Supabase keys may not be set.";
  return message || "Something went wrong. Try again.";
}

/**
 * Email + password and Google sign-in (Supabase Auth). Phone numbers are collected at checkout for delivery.
 * Phone OTP can be added later as another method (see PhoneLogin.tsx) without changing orders or roles.
 */
export function AuthForm({ next, staff = false }: { next: string; staff?: boolean }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const callback = (to: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}`;

  async function google() {
    setBusy(true); setErr(null);
    const { error } = await getBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback(next) } });
    if (error) { setBusy(false); setErr(explain(error.message, error.status)); }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    try { await run(e); } catch (x) { setBusy(false); setErr(explain(x instanceof Error ? x.message : "")); }
  }
  async function run(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim().toLowerCase();
    const password = String(f.get("password") ?? "");
    setBusy(true); setErr(null); setInfo(null);
    const sb = getBrowserClient();
    if (mode === "signin") {
      const { error } = await withTimeout(sb.auth.signInWithPassword({ email, password }));
      setBusy(false);
      if (error) return setErr(explain(error.message, error.status));
      return window.location.assign(next);
    }
    if (mode === "signup") {
      if (password.length < 8) { setBusy(false); return setErr("Use at least 8 characters for your password."); }
      const { data, error } = await withTimeout(sb.auth.signUp({ email, password, options: { emailRedirectTo: callback(next), data: { full_name: String(f.get("full_name") ?? "").trim() } } }));
      setBusy(false);
      if (error) return setErr(explain(error.message, error.status));
      if (data.session) return window.location.assign(next);
      return setInfo(`We’ve sent a confirmation link to ${email}. Open it to finish creating your account.`);
    }
    const { error } = await withTimeout(sb.auth.resetPasswordForEmail(email, { redirectTo: callback("/auth/reset") }));
    setBusy(false);
    if (error) return setErr(explain(error.message, error.status));
    setInfo(`If an account exists for ${email}, a password reset link is on its way.`);
  }

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : staff ? "Staff sign in" : "Welcome back";
  const sub = mode === "signup" ? "Order in a minute and track every delivery." : mode === "forgot" ? "We’ll email you a link to choose a new password." : staff ? "Sign in with your staff email or Google account." : "Sign in to order, track deliveries and manage your meal plan.";
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[34px] leading-tight">{title}</h1>
        <p className="mt-2 text-muted">{sub}</p>
      </div>
      {mode !== "forgot" && (
        <>
          <button type="button" onClick={google} disabled={busy} className="flex h-12 items-center justify-center gap-3 rounded-[12px] border border-line-strong bg-surface font-semibold transition-colors hover:bg-raised disabled:opacity-50">
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or with email<span className="h-px flex-1 bg-line" /></div>
        </>
      )}
      {err && <Banner tone="danger" title={err} />}
      {info && <Banner tone="success" title={info} />}
      <form className="flex flex-col gap-4" onSubmit={submit}>
        {mode === "signup" && <Field id="full_name" name="full_name" label="Your name" autoComplete="name" required />}
        <Field id="email" name="email" type="email" label="Email" autoComplete="email" required />
        {mode !== "forgot" && <Field id="password" name="password" type="password" label="Password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : undefined} hint={mode === "signup" ? "At least 8 characters." : undefined} required />}
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
      </form>
      <div className="flex flex-wrap justify-between gap-3 text-sm">
        {mode === "signin" && <><button type="button" className="font-semibold text-brand" onClick={() => { setMode("signup"); setErr(null); setInfo(null); }}>New here? Create an account</button><button type="button" className="text-muted hover:text-ink" onClick={() => { setMode("forgot"); setErr(null); setInfo(null); }}>Forgot password?</button></>}
        {mode !== "signin" && <button type="button" className="font-semibold text-brand" onClick={() => { setMode("signin"); setErr(null); setInfo(null); }}>Back to sign in</button>}
      </div>
    </div>
  );
}
