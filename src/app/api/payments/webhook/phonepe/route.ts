import { createAdminClient } from "@/lib/supabase/admin";
import { phonepe } from "@/lib/payments/phonepe";
import { applyPaymentResult } from "@/lib/payments/service";
import { getSettings } from "@/lib/settings";
import { json } from "@/lib/api";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const hook = await phonepe.verifyWebhook(req.headers, raw);
  let db: ReturnType<typeof createAdminClient>;
  try { db = createAdminClient(); } catch {
    log("error", "webhook.not_configured", { provider: "phonepe" });
    return json({ ok: false, error: "not configured" }, 503); // PhonePe retries later
  }
  const { data: ev, error: evErr } = await db.from("payment_events").insert({
    provider: "phonepe", event_type: hook.eventType, provider_order_id: hook.providerOrderId ?? null, dedupe_key: hook.dedupeKey ?? null,
    signature_valid: hook.valid, payload: hook.raw as object,
  }).select("id").single();
  if (evErr?.code === "23505") return json({ ok: true, duplicate: true });
  if (!hook.valid) { log("warn", "webhook.invalid_signature", { provider: "phonepe" }); return json({ ok: false }, 401); }
  if (!hook.providerOrderId) return json({ ok: true });

  const { data: payment } = await db.from("payments").select("id").eq("provider", "phonepe").eq("provider_order_id", hook.providerOrderId).maybeSingle();
  if (!payment) { log("warn", "webhook.unknown_payment", { ref: hook.providerOrderId }); return json({ ok: true }); }

  try {
    // Defence in depth: never trust the webhook body alone, confirm with PhonePe's status API.
    const status = await phonepe.getStatus(hook.providerOrderId);
    if (status) await applyPaymentResult(db, payment.id, status, await getSettings(), { source: `webhook:${hook.eventType}` });
    if (ev) await db.from("payment_events").update({ processed: true, payment_id: payment.id }).eq("id", ev.id);
  } catch (e) {
    if (ev) await db.from("payment_events").update({ error: String(e), payment_id: payment.id }).eq("id", ev.id);
    log("error", "webhook.process_failed", { error: String(e) });
    return json({ ok: false }, 500);
  }
  return json({ ok: true });
}
