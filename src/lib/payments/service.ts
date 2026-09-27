import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { getProvider } from "./index";
import type { StatusResult } from "./types";
import { transition, recalcEta } from "@/lib/orders";
import { log } from "@/lib/log";
import type { Settings } from "@/lib/types";

/** Creates a fresh payment attempt for an order that is waiting for payment. */
export async function startPayment(db: SupabaseClient, orderId: string) {
  const { data: order, error } = await db.from("orders").select("id, order_number, status, total_paise").eq("id", orderId).single();
  if (error || !order) throw new Error("ORDER_NOT_FOUND");
  if (order.status === "PAYMENT_FAILED") await transition(db, orderId, "PAYMENT_PENDING", "system", "retry");
  else if (order.status !== "PAYMENT_PENDING") throw new Error("ORDER_NOT_PAYABLE");

  const provider = getProvider();
  const { count } = await db.from("payments").select("id", { count: "exact", head: true }).eq("order_id", orderId);
  const reference = `${order.order_number}-${(count ?? 0) + 1}`;
  const result = await provider.createPayment({
    reference, amountPaise: order.total_paise, orderNumber: order.order_number, orderId,
    returnUrl: `${env.siteUrl}/orders/${orderId}?paid=1`,
  });
  const { data: payment, error: pErr } = await db.from("payments").insert({
    order_id: orderId, provider: provider.id, provider_order_id: result.providerOrderId, amount_paise: order.total_paise,
    status: "PENDING", redirect_url: result.redirectUrl ?? null, qr_payload: result.qrPayload ?? null, expires_at: result.expiresAt?.toISOString() ?? null,
  }).select("*").single();
  if (pErr) throw new Error(pErr.message);
  await db.from("orders").update({ payment_status: "PENDING" }).eq("id", orderId);
  log("info", "payment.created", { orderId, provider: provider.id, reference });
  return payment;
}

/**
 * The only path that marks an order paid. Called after a verified webhook, a provider status API check,
 * or (manual UPI) a staff member confirming the bank credit. Verifies the amount against both records.
 */
export async function applyPaymentResult(
  db: SupabaseClient, paymentId: string, result: Pick<StatusResult, "status" | "amountPaise" | "providerPaymentId" | "transactionReference">,
  settings: Settings, meta: { source: string; verifiedBy?: string },
) {
  const { data: p } = await db.from("payments").select("*, orders(id, status, total_paise, kind)").eq("id", paymentId).single();
  if (!p) throw new Error("PAYMENT_NOT_FOUND");
  const order = p.orders as { id: string; status: string; total_paise: number; kind: string };
  if (p.status === "PAID") return { ok: true, already: true };

  if (result.status === "PAID") {
    const amountOk = result.amountPaise === p.amount_paise && p.amount_paise === order.total_paise;
    if (!amountOk) {
      await db.from("payments").update({ status: "NEEDS_REVIEW", provider_payment_id: result.providerPaymentId ?? null, transaction_reference: result.transactionReference ?? null }).eq("id", paymentId);
      log("error", "payment.amount_mismatch", { paymentId, expected: p.amount_paise, received: result.amountPaise, orderTotal: order.total_paise });
      return { ok: false, reason: "AMOUNT_MISMATCH" };
    }
    await db.from("payments").update({
      status: "PAID", paid_at: new Date().toISOString(), provider_payment_id: result.providerPaymentId ?? null,
      transaction_reference: result.transactionReference ?? null, verified_by: meta.verifiedBy ?? null,
    }).eq("id", paymentId);
    if (["PAYMENT_PENDING", "PAYMENT_PROCESSING"].includes(order.status)) {
      await transition(db, order.id, "PAYMENT_PAID", "payment", meta.source);
      if (settings.auto_confirm_paid_orders && order.kind === "ORDER") {
        await transition(db, order.id, "CONFIRMED", "system", "auto-confirm");
        await recalcEta(db, order.id, "confirmed", settings);
      }
    }
    return { ok: true };
  }
  if (result.status === "FAILED") {
    await db.from("payments").update({ status: "FAILED" }).eq("id", paymentId);
    if (["PAYMENT_PENDING", "PAYMENT_PROCESSING"].includes(order.status)) await transition(db, order.id, "PAYMENT_FAILED", "payment", meta.source);
    return { ok: true };
  }
  return { ok: true, pending: true };
}

/** Pull-based reconciliation: asks the provider directly. Safe to call repeatedly. */
export async function reconcileOrder(db: SupabaseClient, orderId: string, settings: Settings) {
  const { data: p } = await db.from("payments").select("id, provider, provider_order_id, status").eq("order_id", orderId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!p || p.status === "PAID") return;
  const provider = getProvider(p.provider);
  if (!provider.autoVerifies) return;
  const status = await provider.getStatus(p.provider_order_id);
  if (!status) return;
  await db.from("payment_events").insert({ payment_id: p.id, provider: p.provider, event_type: "status_check", provider_order_id: p.provider_order_id, signature_valid: true, processed: true, payload: status.raw as object });
  await applyPaymentResult(db, p.id, status, settings, { source: "status_api" });
}
