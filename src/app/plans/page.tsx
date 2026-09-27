import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { PlanBuilder } from "@/components/site/PlanBuilder";
import { Empty } from "@/components/ui";
import { getHome, getPlans } from "@/lib/queries";
import { Faq, PlansHow, Plate } from "@/components/home/Sections";
import { DEFAULT_SECTIONS } from "@/lib/defaults";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Meal plans", description: "Breakfast, lunch and dinner delivered daily. Pause, skip or change any day." };

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const [plans, settings, session, { sections }] = await Promise.all([getPlans(), getSettings(), getSessionUser(), getHome()]);
  const content = (k: string) => ({ ...DEFAULT_SECTIONS[k], ...(sections[k]?.content ?? {}) });
  let addresses: Address[] = [];
  let menu: { weekday: number; meal: string; name: string }[] = [];
  if (session.user) addresses = ((await session.supabase.from("addresses").select("*").order("is_default", { ascending: false })).data ?? []) as Address[];
  const chosen = plans.find((p) => p.slug === plan) ?? plans.find((p) => p.highlight) ?? plans[0];
  if (chosen) {
    const db = await createClient();
    const { data } = await db.from("plan_menu").select("weekday, meal, custom_name, products(name)").eq("plan_id", chosen.id).eq("week", 1);
    menu = (data ?? []).map((r) => ({ weekday: r.weekday, meal: r.meal, name: r.custom_name ?? (r.products as unknown as { name: string } | null)?.name ?? "" }));
  }
  return (
    <Shell cartBar={false}>
      <div className="mx-auto max-w-[1320px] px-4 pb-8 pt-8 md:px-8 md:pt-12">
        {plans.length === 0 ? <Empty title="Meal plans are coming soon" body="Add plans in the admin portal and they appear here." /> :
          <PlanBuilder plans={plans} initialSlug={chosen?.slug} addresses={addresses} signedIn={!!session.user} phone={session.profile?.phone ?? ""} kitchen={{ lat: settings.kitchen_lat, lng: settings.kitchen_lng }} radiusKm={Number(settings.delivery_radius_km)} taxBps={settings.tax_rate_bps} weekMenu={menu} />}
      </div>
      <PlansHow c={content("plans_how")} />
      <Plate c={content("plate")} />
      <Faq c={content("faq")} />
    </Shell>
  );
}
