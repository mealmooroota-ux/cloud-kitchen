"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";

/** Refreshes the board when any order changes (staff RLS lets them receive all orders). Plays a chime for new paid orders. */
export function LiveRefresh() {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const sb = getBrowserClient();
    const ch = sb.channel("admin-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (msg: { new: Record<string, unknown> }) => {
      const n = msg.new as { status?: string };
      if (n?.status === "PAYMENT_PAID") {
        try { const a = new AudioContext(); const o = a.createOscillator(); o.frequency.value = 880; o.connect(a.destination); o.start(); o.stop(a.currentTime + 0.18); } catch { /* no audio */ }
      }
      const now = Date.now();
      if (now - last.current > 800) { last.current = now; router.refresh(); }
    }).subscribe((s: string) => setLive(s === "SUBSCRIBED"));
    const poll = setInterval(() => router.refresh(), 30000); // safety net
    return () => { sb.removeChannel(ch); clearInterval(poll); };
  }, [router]);
  return <span className="flex items-center gap-2 text-sm text-muted"><span className={`size-2 rounded-full ${live ? "bg-success" : "bg-line-strong"}`} />{live ? "Realtime connected" : "Connecting…"}</span>;
}
