import { createHash } from "crypto";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { json, fail, sameOrigin } from "@/lib/api";

const Body = z.object({ folder: z.enum(["cloud-kitchen/products", "cloud-kitchen/site", "cloud-kitchen/plans"]) });

/** Signs a direct browser->Cloudinary upload. The API secret never leaves the server. Admin only. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("FORBIDDEN", "Bad origin.", 403);
  const { role } = await getSessionUser();
  if (role !== "ADMIN") return fail("FORBIDDEN", "Admins only.", 403);
  if (!env.cloudinaryKey || !env.cloudinarySecret) return fail("CONFIG", "Cloudinary API key/secret are not configured.", 500);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("INVALID", "Invalid folder.");
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: parsed.data.folder, timestamp: String(timestamp) };
  const toSign = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&");
  const signature = createHash("sha1").update(toSign + env.cloudinarySecret).digest("hex");
  return json({ ...params, signature, apiKey: env.cloudinaryKey, cloudName: env.cloudinaryCloud });
}
