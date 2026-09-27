"use client";
import { useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { Banner, Button, Field } from "@/components/ui";

function normalise(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return "+91" + d;
  if (d.length === 12 && d.startsWith("91")) return "+" + d;
  return null;
}

/** Phone OTP via Supabase Auth. Codes are generated, hashed, rate-limited and expired by Supabase, never stored by us. */
function explain(err: { message?: string; status?: number; code?: string }) {
  const m = (err.message ?? "").toLowerCase();
  if (err.status === 429 || m.includes("rate")) return { title: "Too many codes requested.", detail: "Wait a minute and try again." };
  if (m.includes("unsupported phone provider") || m.includes("phone provider") || m.includes("sms provider"))
    return { title: "Phone sign-in isn’t switched on yet.", detail: "The site owner needs to enable Phone sign-in and an SMS provider in Supabase (Authentication → Sign In / Providers → Phone)." };
  if (m.includes("signups not allowed") || m.includes("signup")) return { title: "New sign-ups are turned off.", detail: "The site owner needs to allow new users in Supabase (Authentication → Sign In / Providers)." };
  if (m.includes("invalid") && m.includes("phone")) return { title: "That number doesn’t look right.", detail: "Enter a 10-digit Indian mobile number." };
  if (m.includes("fetch") || m.includes("network")) return { title: "We couldn’t reach the sign-in service.", detail: "Check your connection. If it keeps happening, the site’s Supabase keys may not be set." };
  return { title: "We couldn’t send a code to that number.", detail: err.message ? `Reason: ${err.message}` : "Try again in a moment." };
}

export function PhoneLogin({ next, heading, subheading }: { next: string; heading?: string; subheading?: string }) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);

  async function send() {
    const e164 = normalise(phone);
    if (!e164) return setErr("Enter a 10-digit Indian mobile number.");
    setBusy(true); setErr(null); setDetail(null);
    const { error } = await getBrowserClient().auth.signInWithOtp({ phone: e164 });
    setBusy(false);
    if (error) { const x = explain(error); setDetail(x.detail); return setErr(x.title); }
    setStep("code"); setWait(30); setTimeout(() => codeRef.current?.focus(), 50);
  }
  async function verify() {
    if (!/^\d{6}$/.test(code)) return setErr("Enter the 6-digit code.");
    setBusy(true); setErr(null); setDetail(null);
    const { error } = await getBrowserClient().auth.verifyOtp({ phone: normalise(phone)!, token: code, type: "sms" });
    setBusy(false);
    if (error) return setErr("That code didn’t work. Check it or request a new one.");
    window.location.assign(next);
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[34px] leading-tight">{step === "phone" ? heading ?? "Sign in with your phone" : "Enter the 6-digit code"}</h1>
        <p className="mt-2 text-muted">{step === "phone" ? subheading ?? "We’ll text you a one-time code. No password needed." : `Sent to ${normalise(phone)}.`}</p>
      </div>
      {err && <Banner tone="danger" title={err}>{detail}</Banner>}
      {step === "phone" ? (
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <Field id="phone" label="Mobile number" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button size="lg" type="submit" disabled={busy}>{busy ? "Sending…" : "Send code"}</Button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); verify(); }}>
          <label htmlFor="otp" className="text-sm font-semibold">One-time code</label>
          <input ref={codeRef} id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="tabular h-14 rounded-[8px] border border-line-strong bg-raised px-4 text-center font-mono text-2xl tracking-[0.5em] outline-none focus:border-brand" />
          <Button size="lg" type="submit" disabled={busy}>{busy ? "Checking…" : "Verify and continue"}</Button>
          <div className="flex justify-between text-sm">
            <button type="button" className="font-semibold text-brand" onClick={() => { setStep("phone"); setCode(""); }}>Change number</button>
            <button type="button" className="font-semibold text-brand disabled:text-muted" disabled={wait > 0 || busy} onClick={send}>{wait > 0 ? `Resend in 0:${String(wait).padStart(2, "0")}` : "Resend code"}</button>
          </div>
          <p className="text-xs text-muted">We never ask for this code on a call.</p>
        </form>
      )}
    </div>
  );
}
