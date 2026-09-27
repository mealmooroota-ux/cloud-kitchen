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
  upi: { vpa: read("UPI_PAYEE_VPA"), name: read("UPI_PAYEE_NAME") ?? "Cloud Kitchen" },
  maps: { provider: read("MAPS_PROVIDER") as "google" | "ors" | undefined, key: read("MAPS_API_KEY") },
  cronSecret: read("CRON_SECRET"),
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
