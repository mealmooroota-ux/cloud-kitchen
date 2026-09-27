import { Shell } from "@/components/site/Shell";
import { CookerStory } from "@/components/home/CookerStory";
import { Closing, DishGrid, Faq, Hero, Homemade, How, Marquee, Plans, PlansHow, Plate } from "@/components/home/Sections";
import { getHome, getMenu, getPlans } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { DEFAULT_LAYERS, DEFAULT_SECTIONS, HOME_ORDER } from "@/lib/defaults";
import { siteUrl } from "@/lib/site";
import { BRAND } from "@/lib/brand";

export const revalidate = 60;

export default async function Home() {
  const [{ sections, layers }, { products }, plans, settings] = await Promise.all([getHome(), getMenu(), getPlans(), getSettings()]);
  // Default order, overridden by positions/visibility saved in Admin > Site content.
  const order = HOME_ORDER
    .map((k, i) => ({ k, pos: sections[k]?.position ?? i + 1, on: sections[k]?.enabled ?? true }))
    .filter((x) => x.on).sort((a, b) => a.pos - b.pos).map((x) => x.k);
  const content = (k: string) => ({ ...DEFAULT_SECTIONS[k], ...(sections[k]?.content ?? {}) });
  const available = products.filter((p) => p.is_available);
  const healthy = available.filter((p) => p.tags.includes(String(content("healthy").tag ?? "Healthy"))).slice(0, 4);
  const signatures = available.filter((p) => p.show_on_home).slice(0, 4);
  const withPhotos = available.filter((p) => p.product_media?.some((m) => m.kind === "image"));
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Restaurant", name: BRAND.name, slogan: BRAND.tagline, url: siteUrl(),
    servesCuisine: ["South Indian", "North Indian", "Healthy"], address: settings.kitchen_address ?? "Bengaluru", hasMenu: `${siteUrl()}/menu`,
  };

  const render: Record<string, () => React.ReactNode> = {
    hero: () => <Hero c={content("hero")} settings={settings} today={signatures.length ? signatures : available} />,
    marquee: () => (withPhotos.length >= 4 ? <Marquee c={content("marquee")} items={withPhotos.slice(0, 12)} /> : null),
    cooker: () => { const c = content("cooker"); return <CookerStory eyebrow={String(c.eyebrow)} title={String(c.title)} body={String(c.body)} layers={layers.length ? layers : DEFAULT_LAYERS} />; },
    homemade: () => <Homemade c={content("homemade")} />,
    plate: () => <Plate c={content("plate")} />,
    healthy: () => (healthy.length ? <DishGrid c={content("healthy")} items={healthy} tone="herb" bg="bg-herb-soft" link={{ href: "/menu?tag=Healthy", label: "All healthy dishes" }} /> : null),
    plans: () => (plans.length ? <Plans c={content("plans")} plans={plans} /> : null),
    plans_how: () => <PlansHow c={content("plans_how")} />,
    signatures: () => (signatures.length ? <DishGrid c={content("signatures")} items={signatures} link={{ href: "/menu", label: "See the full menu" }} /> : null),
    how: () => <How c={content("how")} />,
    faq: () => <Faq c={content("faq")} />,
    closing: () => <Closing c={content("closing")} settings={settings} />,
  };
  return (
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {order.map((k) => <div key={k}>{render[k]?.()}</div>)}
    </Shell>
  );
}
