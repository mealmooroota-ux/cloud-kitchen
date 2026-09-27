import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LogoMark } from "@/components/brand/Logo";

export function Wordmark({ tagline = true, className = "", tone = "color" }: { tagline?: boolean; className?: string; tone?: "color" | "onDark" }) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className}`} aria-label={`${BRAND.name}, ${BRAND.tagline}. Home`}>
      <LogoMark size={40} tone={tone} className="shrink-0 transition-transform duration-500 ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]" animated />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[21px] font-semibold tracking-[0.08em] md:text-[24px]">{BRAND.name}</span>
        {tagline && <span className="mt-1 hidden whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-[0.24em] text-muted min-[430px]:block md:text-[10.5px]">{BRAND.tagline}</span>}
      </span>
    </Link>
  );
}
