import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { CheckoutForm } from "@/components/site/CheckoutForm";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import type { Address } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const { supabase } = await requireUser("/checkout");
  const settings = await getSettings();
  const { data } = await supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at", { ascending: false });
  return (
    <Shell cartBar={false}>
      <CheckoutForm addresses={(data ?? []) as Address[]} kitchen={{ lat: settings.kitchen_lat, lng: settings.kitchen_lng }} radiusKm={Number(settings.delivery_radius_km)} open={settings.is_open} />
    </Shell>
  );
}
