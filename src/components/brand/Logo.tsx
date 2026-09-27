// MOOROOTA mark: an "m" made of rising steam over a bowl. Home-cooked, hot, every day.
// Construction: 64×64 grid. Bowl = half-disc (r 25) + 3u rim gap. Steam "m" = two 7u arches with
// wavering stems, stroke 5u, round caps. Keep clear space of 8u around the mark.
export const MARK_BOWL = "M7 37H57C57 50.8 45.8 60 32 60S7 50.8 7 37Z";
export const MARK_STEAM = "M18 31C15 27 21 24.5 18 20.5a7 7 0 0 1 14 0C29 24.5 35 27 32 31M32 20.5a7 7 0 0 1 14 0C43 24.5 49 27 46 31";

type Tone = "color" | "ink" | "light" | "onDark";
const TONES: Record<Tone, { bowl: string; steam: string }> = {
  color: { bowl: "var(--color-brand)", steam: "var(--color-ink)" },
  ink: { bowl: "currentColor", steam: "currentColor" },
  light: { bowl: "#FFF8EE", steam: "#FFF8EE" },
  onDark: { bowl: "var(--color-brand)", steam: "#FFF8EE" },
};

export function LogoMark({ size = 36, tone = "color", animated = false, className = "", title }: { size?: number; tone?: Tone; animated?: boolean; className?: string; title?: string }) {
  const t = TONES[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={`${animated ? "logo-animated" : ""} ${className}`} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path className="logo-bowl" d={MARK_BOWL} fill={t.bowl} />
      <path className="logo-steam" d={MARK_STEAM} fill="none" stroke={t.steam} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
    </svg>
  );
}
