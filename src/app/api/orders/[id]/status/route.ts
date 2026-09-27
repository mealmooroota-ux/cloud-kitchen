import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcileOrder } from "@/lib/payments/service";
import { getSettings } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";
import { json, fail } from "@/lib/api";

/** Customer polls this while paying. It asks the PROVIDER (not the browser) whether the payment went through. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("AUTH", "Sign in again.", 401);
  const { data: own } = await supabase.from("orders").select("id, status").eq("id", id).maybeSingle();
  if (!own) return fail("NOT_FOUND", "Order not found.", 404);
  if (["PAYMENT_PENDING", "PAYMENT_PROCESSING"].includes(own.status) && (await rateLimit(`status:${id}`, 30, 60))) {
    try { await reconcileOrder(createAdminClient(), id, await getSettings()); } catch { /* provider hiccup: webhook will still arrive */ }
  }
  const { data } = await supabase.from("orders").select("id, status, payment_status, estimated_ready_at, estimated_delivery_at").eq("id", id).single();
  return json(data);
}
