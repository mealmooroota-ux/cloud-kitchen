import "server-only";
import { unstable_cache } from "next/cache";
import type { Settings } from "@/lib/types";
import { createPublicClient, PUBLIC_TAG } from "@/lib/supabase/public";
import { env, isSupabaseConfigured } from "@/lib/env";

export const DEFAULT_SETTINGS: Settings = {
  kitchen_name: "MOOROOTA", kitchen_address: null, kitchen_lat: 12.9716, kitchen_lng: 77.5946, delivery_radius_km: 7,
  delivery_fee_paise: 4000, free_delivery_above_paise: null, tax_rate_bps: 500, packing_minutes: 5, buffer_minutes: 5,
  min_order_paise: 0, is_open: true, open_time: "11:00", close_time: "23:00", auto_confirm_paid_orders: false,
  support_phone: null, support_email: null, fssai_license: null,
};

/** Kitchen settings, cached and refreshed the moment an admin saves settings or toggles the kitchen. */
const cachedSettings = () => unstable_cache(async (): Promise<Settings> => {
  try {
    const { data } = await createPublicClient().from("settings").select("*").eq("id", 1).maybeSingle();
    return { ...DEFAULT_SETTINGS, ...(data ?? {}) } as Settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}, ["settings-v1", env.supabaseUrl ?? "none"], { tags: [PUBLIC_TAG], revalidate: 600 })();
export const getSettings = (): Promise<Settings> => (isSupabaseConfigured() ? cachedSettings() : Promise.resolve(DEFAULT_SETTINGS));
