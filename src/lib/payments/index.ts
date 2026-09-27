import "server-only";
import { env } from "@/lib/env";
import type { PaymentProvider } from "./types";
import { phonepe } from "./phonepe";
import { manualUpi } from "./manual-upi";

const providers: Record<string, PaymentProvider> = { phonepe, manual_upi: manualUpi };
export function getProvider(id?: string): PaymentProvider {
  return providers[id ?? env.paymentProvider] ?? manualUpi;
}
