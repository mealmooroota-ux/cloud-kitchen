import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SettingsForm, CouponForm } from "@/components/admin/SettingsForm";
import { Pill } from "@/components/ui";
import { rupees } from "@/lib/format";

export default async function Settings() {
  const { supabase } = await requireStaff(["ADMIN"]);
  const s = await getSettings();
  const { data: coupons } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  const provider = process.env.PAYMENT_PROVIDER ?? "manual_upi";
  const checks = [
    ["Payment provider", provider === "phonepe" ? (process.env.PHONEPE_CLIENT_ID ? `PhonePe (${process.env.PHONEPE_ENV ?? "sandbox"})` : "PhonePe selected but not configured") : process.env.UPI_PAYEE_VPA ? "Manual UPI (staff verify)" : "Manual UPI: UPI_PAYEE_VPA missing"],
    ["Road routing for ETA", process.env.MAPS_PROVIDER && process.env.MAPS_API_KEY ? process.env.MAPS_PROVIDER : "Not configured (prep-time only)"],
    ["Cloudinary uploads", process.env.CLOUDINARY_API_SECRET ? "Configured" : "Missing API key/secret"],
    ["Server key", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Configured" : "Missing"],
  ];
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="rounded-[12px] border border-line bg-surface p-5"><h2 className="mb-3 font-semibold">Integrations</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">{checks.map(([k, v]) => <div key={k} className="flex justify-between gap-3 rounded-[8px] bg-raised px-3 py-2"><dt>{k}</dt><dd className="text-right text-muted">{v}</dd></div>)}</dl>
        <p className="mt-2 text-xs text-muted">Keys are set as environment variables in Vercel, never here.</p>
      </section>
      <SettingsForm s={s} />
      <section className="flex flex-col gap-3 rounded-[12px] border border-line bg-surface p-5"><h2 className="font-semibold">Coupons</h2>
        {(coupons ?? []).map((c) => <div key={c.code} className="flex flex-wrap items-center gap-3 text-sm"><span className="tabular font-mono font-medium">{c.code}</span><span>{c.kind === "PERCENT" ? `${c.value}% off` : `${rupees(c.value)} off`}</span><span className="text-muted">used {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</span>{!c.is_active && <Pill>Off</Pill>}</div>)}
        <CouponForm />
      </section>
    </div>
  );
}
