"use client";
import { useEffect, useState } from "react";

export type Tier = "full" | "lite" | "static" | "pending";
/** Progressive enhancement: full WebGL scene, a still image for weak devices, or static for reduced motion. */
export function useTier(): Tier {
  const [tier, setTier] = useState<Tier>("pending");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setTier("static");
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
    if (nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType ?? "")) return setTier("static");
    // Slow mobile data: skip the ~750 KB 3D model and show the still photo.
    if (nav.connection?.effectiveType === "3g") return setTier("lite");
    let gl2 = false;
    try { gl2 = !!document.createElement("canvas").getContext("webgl2"); } catch { gl2 = false; }
    if (!gl2) return setTier("lite");
    if ((nav.deviceMemory ?? 8) < 4 || (navigator.hardwareConcurrency ?? 8) < 4) return setTier("lite");
    setTier("full");
  }, []);
  return tier;
}
