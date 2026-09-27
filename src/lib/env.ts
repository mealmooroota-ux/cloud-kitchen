import "server-only";
import { siteUrl } from "@/lib/site";

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export const env = {
  siteUrl: siteUrl(),
  supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  cloudinaryCloud: read("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME") ?? "zu6iogvj",
  cloudinaryKey: read("CLOUDINARY_API_KEY"),
  cloudinarySecret: read("CLOUDINARY_API_SECRET"),
  paymentProvider: (read("PAYMENT_PROVIDER") ?? "manual_upi") as "phonepe" | "manual_upi",
  phonepe: {
    env: (read("PHONEPE_ENV") ?? "sandbox") as "sandbox" | "production",
    clientId: read("PHONEPE_CLIENT_ID"),
    clientSecret: read("PHONEPE_CLIENT_SECRET"),
    clientVersion: read("PHONEPE_CLIENT_VERSION") ?? "1",
    webhookUser: read("PHONEPE_WEBHOOK_USERNAME"),
    webhookPass: read("PHONEPE_WEBHOOK_PASSWORD"),
  },
  upi: { vpa: read("UPI_PAYEE_VPA"), name: read("UPI_PAYEE_NAME") ?? "MOOROOTA" },
  maps: { provider: read("MAPS_PROVIDER") as "google" | "ors" | undefined, key: read("MAPS_API_KEY") },
  cronSecret: read("CRON_SECRET"),
  /** Emails that become ADMIN automatically once signed in with a confirmed email (or Google), e.g. "you@gmail.com". */
  adminEmails: (read("ADMIN_EMAILS") ?? "").split(",").map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@")),
  /** Phone numbers that become ADMIN automatically on sign-in, e.g. "9742022976,8660828930". */
  adminPhones: (read("ADMIN_PHONES") ?? "").split(",").map((p) => p.replace(/\D/g, "")).filter((p) => p.length >= 10).map((p) => p.slice(-10)),
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
