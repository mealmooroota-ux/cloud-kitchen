import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { SmoothScroll } from "@/components/site/SmoothScroll";

// Self-hosted variable fonts: no third-party requests, works offline at build time.
const fraunces = localFont({ src: "../fonts/Fraunces-opsz.woff2", variable: "--font-fraunces", weight: "100 900", display: "swap" });

const site = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Cloud Kitchen · Homemade, healthy food in Bengaluru", template: "%s · Cloud Kitchen" },
  description: "Homemade, healthy meals cooked to order in small batches. Order a dish or get breakfast, lunch and dinner delivered daily with a meal plan.",
  openGraph: { type: "website", siteName: "Cloud Kitchen", locale: "en_IN", images: ["/images/cooker-exploded.webp"] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#F7F2E9", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2">Skip to content</a>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
