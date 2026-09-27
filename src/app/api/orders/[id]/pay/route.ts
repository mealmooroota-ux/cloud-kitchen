import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { startPayment } from "@/lib/payments/service";
import { rateLimit } from "@/lib/rate-limit";
import { json, fail, sameOrigin } from "@/lib/api";

/** Start a new payment attempt (retry after failure / expired QR). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return fail("FORBIDDEN", "Bad origin.", 403);
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("AUTH", "Sign in again.", 401);
  const { data: own } = await supabase.from("orders").select("id").eq("id", id).maybeSingle();
  if (!own) return fail("NOT_FOUND", "Order not found.", 404);
  if (!(await rateLimit(`pay:${id}`, 5, 600))) return fail("RATE", "Too many attempts. Wait a few minutes.", 429);
  try {
    const p = await startPayment(createAdminClient(), id);
    return json({ redirectUrl: p.redirect_url, qr: p.qr_payload });
  } catch (e) {
    return fail("PAY", String(e).includes("NOT_PAYABLE") ? "This order can’t be paid again." : "Couldn’t start the payment. Try again.", 422);
  }
}
