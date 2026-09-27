import "server-only";
import { NextResponse } from "next/server";
export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export const fail = (code: string, message: string, status = 400) => json({ error: { code, message } }, status);
/** Same-origin check for state-changing requests (CSRF defence on top of SameSite cookies). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(req.url).host || new URL(origin).host === req.headers.get("x-forwarded-host"); } catch { return false; }
}
