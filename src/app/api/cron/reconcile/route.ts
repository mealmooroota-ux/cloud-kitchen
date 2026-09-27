import { createAdminClient } from "@/lib/supabase/admin";
import { reconcileOrder } from "@/lib/payments/service";
import { getSettings } from "@/lib/settings";
import { env } from "@/lib/env";
import { json, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Vercel Cron: re-checks unpaid orders with the provider, in case a webhook was missed. */
export async function GET(req: Request) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) return fail("FORBIDDEN", "Forbidden", 403);
  const db = createAdminClient();
  const settings = await getSettings();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data } = await db.from("orders").select("id").in("status", ["PAYMENT_PENDING", "PAYMENT_PROCESSING"]).gte("created_at", since).limit(50);
  let checked = 0;
  for (const o of data ?? []) { try { await reconcileOrder(db, o.id, settings); checked++; } catch { /* continue */ } }
  return json({ checked });
}
