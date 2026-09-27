/**
 * The site's public URL. Tolerates a missing, blank, or scheme-less NEXT_PUBLIC_SITE_URL
 * (e.g. "your-domain.com"), falling back to the Vercel deployment URL, then localhost.
 */
export function siteUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL];
  for (const raw of candidates) {
    const v = raw?.trim().replace(/\/+$/, "");
    if (!v) continue;
    const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    try { return new URL(withScheme).origin; } catch { /* try the next one */ }
  }
  return "http://localhost:3000";
}
