import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Cookie-free client for PUBLIC data (menu, plans, site content, settings).
 * Because it never reads cookies, pages that only use it can be cached and served instantly.
 * Row Level Security still applies (anonymous role): it can only read what visitors are allowed to see.
 */
export function createPublicClient() {
  return createClient(env.supabaseUrl ?? "http://localhost", env.supabaseAnonKey ?? "missing", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cache tag for everything public. Admin edits call revalidateTag(PUBLIC_TAG) so changes show up right away. */
export const PUBLIC_TAG = "public";
