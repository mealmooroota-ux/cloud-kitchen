import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import type { PaymentProvider, StatusResult } from "./types";

const URLS = {
  sandbox: { token: "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token", base: "https://api-preprod.phonepe.com/apis/pg-sandbox" },
  production: { token: "https://api.phonepe.com/apis/identity-manager/v1/oauth/token", base: "https://api.phonepe.com/apis/pg" },
};

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken() {
  const cfg = env.phonepe;
  if (!cfg.clientId || !cfg.clientSecret) throw new Error("PhonePe credentials are not configured");
  if (tokenCache && tokenCache.expiresAt - 60_000 > Date.now()) return tokenCache.token;
  const body = new URLSearchParams({ client_id: cfg.clientId, client_version: cfg.clientVersion, client_secret: cfg.clientSecret, grant_type: "client_credentials" });
  const res = await fetch(URLS[cfg.env].token, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  if (!res.ok) throw new Error(`PhonePe auth failed (${res.status})`);
  const j = await res.json();
  const expiresAt = j.expires_at ? Number(j.expires_at) * 1000 : Date.now() + 10 * 60_000;
  tokenCache = { token: j.access_token, expiresAt };
  return j.access_token as string;
}

function mapState(state: string | undefined): StatusResult["status"] {
  if (state === "COMPLETED") return "PAID";
  if (state === "FAILED") return "FAILED";
  return "PENDING";
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const phonepe: PaymentProvider = {
  id: "phonepe",
  autoVerifies: true,

  async createPayment({ reference, amountPaise, returnUrl, orderId, orderNumber }) {
    const token = await getToken();
    const res = await fetch(`${URLS[env.phonepe.env].base}/checkout/v2/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${token}` },
      body: JSON.stringify({
        merchantOrderId: reference,
        amount: amountPaise,
        expireAfter: 1200,
        metaInfo: { udf1: orderId, udf2: orderNumber },
        paymentFlow: { type: "PG_CHECKOUT", message: `Order ${orderNumber}`, merchantUrls: { redirectUrl: returnUrl } },
      }),
      cache: "no-store",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.redirectUrl) throw new Error(`PhonePe create payment failed (${res.status}): ${j.message ?? j.code ?? "unknown"}`);
    return { providerOrderId: reference, redirectUrl: j.redirectUrl, expiresAt: j.expireAt ? new Date(Number(j.expireAt)) : undefined };
  },

  async getStatus(merchantOrderId) {
    const token = await getToken();
    const res = await fetch(`${URLS[env.phonepe.env].base}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`, {
      headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`PhonePe status failed (${res.status})`);
    const j = await res.json();
    const last = Array.isArray(j.paymentDetails) ? j.paymentDetails[j.paymentDetails.length - 1] : undefined;
    return { status: mapState(j.state), amountPaise: typeof j.amount === "number" ? j.amount : undefined, providerPaymentId: j.orderId, transactionReference: last?.transactionId, raw: j };
  },

  async verifyWebhook(headers, rawBody) {
    const { webhookUser, webhookPass } = env.phonepe;
    let raw: unknown = null;
    try { raw = JSON.parse(rawBody); } catch { /* keep null */ }
    const r = (raw ?? {}) as { event?: string; payload?: { merchantOrderId?: string; orderId?: string; state?: string } };
    const header = (headers.get("authorization") ?? "").trim();
    let valid = false;
    if (webhookUser && webhookPass && header) {
      const expected = createHash("sha256").update(`${webhookUser}:${webhookPass}`).digest("hex");
      valid = safeEqual(header.toLowerCase(), expected) || safeEqual(header.replace(/^SHA256\s*/i, "").toLowerCase(), expected);
    }
    return {
      valid,
      eventType: r.event ?? "unknown",
      providerOrderId: r.payload?.merchantOrderId,
      dedupeKey: r.payload ? `phonepe:${r.event}:${r.payload.orderId}:${r.payload.state}` : undefined,
      raw,
    };
  },
};
