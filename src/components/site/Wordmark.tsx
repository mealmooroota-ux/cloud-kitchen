import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Wordmark({ tagline = true, className = "" }: { tagline?: boolean; className?: string }) {
  return (
    <Link href="/" className={`group flex flex-col leading-none ${className}`} aria-label={`${BRAND.name}, ${BRAND.tagline}. Home`}>
      <span className="font-display text-[22px] font-semibold tracking-[0.08em] md:text-[26px]">{BRAND.name}</span>
      {tagline && <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted md:text-[11px]">{BRAND.tagline}</span>}
    </Link>
  );
}
