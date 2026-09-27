import { siteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const site = siteUrl();
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/orders", "/checkout", "/api"] }], sitemap: `${site}/sitemap.xml` };
}
