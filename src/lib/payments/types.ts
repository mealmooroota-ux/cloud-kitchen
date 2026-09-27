export type ProviderStatus = "PENDING" | "PAID" | "FAILED";
export interface CreatePaymentInput { reference: string; amountPaise: number; orderNumber: string; returnUrl: string; orderId: string }
export interface CreatePaymentResult { providerOrderId: string; redirectUrl?: string; qrPayload?: string; expiresAt?: Date }
export interface StatusResult { status: ProviderStatus; amountPaise?: number; providerPaymentId?: string; transactionReference?: string; raw: unknown }
export interface WebhookResult { valid: boolean; eventType: string; providerOrderId?: string; dedupeKey?: string; raw: unknown }

/** Provider-independent payment interface. Razorpay (or any gateway) is added by implementing this. */
export interface PaymentProvider {
  id: string;
  /** true when the provider can confirm payments by itself (API/webhook). false = staff must verify. */
  autoVerifies: boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getStatus(providerOrderId: string): Promise<StatusResult | null>;
  verifyWebhook(headers: Headers, rawBody: string): Promise<WebhookResult>;
}
