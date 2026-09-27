import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Postgres-backed fixed-window limiter (works across serverless instances). Fails open if the DB is unreachable. */
export async function rateLimit(key: string, max: number, windowSeconds: number) {
  try {
    const { data, error } = await createAdminClient().rpc("check_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
    if (error) return true;
    return Boolean(data);
  } catch {
    return true;
  }
}
