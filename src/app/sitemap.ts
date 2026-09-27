import { siteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";
import { getMenu } from "@/lib/queries";
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
  const { products } = await getMenu();
  return [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/menu`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/plans`, changeFrequency: "weekly", priority: 0.8 },
    ...products.map((p) => ({ url: `${site}/menu/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...["terms", "privacy", "refunds", "delivery", "contact"].map((s) => ({ url: `${site}/legal/${s}`, priority: 0.2 })),
  ];
}
