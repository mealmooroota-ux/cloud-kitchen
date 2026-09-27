"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { OrderStatus } from "@/lib/types";
import { useTier } from "@/components/three/useTier";
import type { CookerPose } from "@/components/three/CookerCanvas";

const CookerCanvas = dynamic(() => import("@/components/three/CookerCanvas"), { ssr: false });

const POSE: Partial<Record<OrderStatus, CookerPose>> = {
  PAYMENT_PENDING: { explode: 0 }, PAYMENT_PROCESSING: { explode: 0 }, PAYMENT_PAID: { explode: 0, spin: 0.15 },
  CONFIRMED: { explode: 0, spin: 0.2 }, PREPARING: { explode: 0, jiggle: true, steam: true, spin: 0.12 },
  READY_FOR_PICKUP: { explode: 0, spin: 0.35 }, OUT_FOR_DELIVERY: { explode: 0, spin: 0.5 }, DELIVERED: { explode: 0.35, steam: true, spin: 0.1 },
};

/** Decorative only: follows the order status, never drives it. */
export function OrderScene({ status }: { status: OrderStatus }) {
  const tier = useTier();
  const pose = POSE[status] ?? { explode: 0 };
  const dim = ["PAYMENT_FAILED", "CANCELLED", "REFUNDED"].includes(status);
  return (
    <div className={`relative h-[240px] overflow-hidden rounded-[32px] bg-raised md:h-[320px] ${dim ? "opacity-50 grayscale" : ""}`} aria-hidden="true">
      {tier === "full" && !dim ? <CookerCanvas pose={pose} framing="tight" className="absolute inset-0" /> : (
        <Image src="/images/cooker-exploded.webp" alt="" fill sizes="600px" className="object-contain p-4" />
      )}
      {pose.steam && !dim && (
        <div className="pointer-events-none absolute left-1/2 top-[18%] flex -translate-x-1/2 gap-3">
          {[0, 1, 2].map((i) => <span key={i} className="block h-10 w-2 rounded-full bg-white/80 blur-[3px]" style={{ animation: `steam 2.6s ${i * 0.5}s ease-out infinite` }} />)}
        </div>
      )}
      {status === "OUT_FOR_DELIVERY" && (
        <svg className="absolute inset-x-6 bottom-5 h-6 w-[calc(100%-48px)]" viewBox="0 0 300 24" preserveAspectRatio="none">
          <path d="M0 12 H300" stroke="var(--color-line-strong)" strokeWidth="2" strokeDasharray="4 6" />
          <circle cx="0" cy="12" r="6" fill="var(--color-brand)"><animate attributeName="cx" from="0" to="300" dur="6s" repeatCount="indefinite" /></circle>
        </svg>
      )}
    </div>
  );
}
