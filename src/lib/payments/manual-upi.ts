import "server-only";
import { env } from "@/lib/env";
import type { PaymentProvider } from "./types";

/** Standard NPCI upi://pay link. encodeURIComponent (not URLSearchParams) so spaces never become "+". */
export function buildUpiUri(p: { vpa: string; name: string; amountPaise: number; note: string; ref: string }) {
  const params: [string, string][] = [
    ["pa", p.vpa], ["pn", p.name], ["am", (p.amountPaise / 100).toFixed(2)], ["cu", "INR"], ["tn", p.note], ["tr", p.ref],
  ];
  return "upi://pay?" + params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

/**
 * Interim provider for a personal / non-API UPI ID.
 * Generates a unique QR per order (amount + order reference pre-filled) pointing at your UPI ID.
 * It CANNOT confirm payment automatically: the order stays "waiting" until staff match the credit
 * in their bank/PhonePe app and confirm it in Admin > Payments (logged with their name and the UTR).
 * Customer screenshots and "I have paid" buttons are never accepted.
 */
export const manualUpi: PaymentProvider = {
  id: "manual_upi",
  autoVerifies: false,
  async createPayment({ reference, amountPaise, orderNumber }) {
    if (!env.upi.vpa) throw new Error("UPI_PAYEE_VPA is not configured");
    return {
      providerOrderId: reference,
      qrPayload: buildUpiUri({ vpa: env.upi.vpa, name: env.upi.name, amountPaise, note: `Order ${orderNumber}`, ref: reference }),
      expiresAt: new Date(Date.now() + 30 * 60_000),
    };
  },
  async getStatus() {
    return null;
  },
  async verifyWebhook() {
    return { valid: false, eventType: "unsupported", raw: null };
  },
};
