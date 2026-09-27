import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { CartLineSchema, priceCart, PricingError } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { json, fail } from "@/lib/api";

const Body = z.object({ lines: z.array(CartLineSchema).max(30), couponCode: z.string().max(40).optional().nullable() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("INVALID", "Invalid cart.");
  try {
    const q = await priceCart(createAdminClient(), parsed.data.lines, await getSettings(), parsed.data.couponCode);
    return json(q);
  } catch (e) {
    if (e instanceof PricingError) return fail(e.code, e.message, 422);
    return fail("SERVER", "Could not price your cart.", 500);
  }
}
