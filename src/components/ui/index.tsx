import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { STATUS_META } from "@/lib/order-state";
import type { OrderStatus } from "@/lib/types";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
const V: Record<Variant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-raised",
  ghost: "text-ink hover:bg-raised",
  danger: "bg-danger text-white hover:opacity-90",
};
const S: Record<Size, string> = { sm: "h-9 px-4 text-sm pointer-coarse:h-11", md: "h-11 px-6 text-sm", lg: "h-14 px-7 text-base" };
export function btnClass(v: Variant = "primary", s: Size = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-[12px] font-semibold transition-colors duration-150 active:scale-[.98] disabled:opacity-40 disabled:pointer-events-none ${V[v]} ${S[s]} ${extra}`;
}
export function Button({ variant = "primary", size = "md", className = "", ...p }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button {...p} className={btnClass(variant, size, className)} />;
}
export function LinkButton({ variant = "primary", size = "md", className = "", ...p }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...p} className={btnClass(variant, size, className)} />;
}

export function Field({ label, error, hint, id, className = "", ...p }: ComponentProps<"input"> & { label: string; error?: string; hint?: string; id: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <input id={id} {...p} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className={`h-12 rounded-[8px] border bg-raised px-3.5 text-ink placeholder:text-muted/70 outline-none focus:border-brand ${error ? "border-danger" : "border-line-strong"}`} />
      {hint && !error && <span className="text-sm text-muted">{hint}</span>}
      {error && <span id={`${id}-err`} className="text-sm text-danger">{error}</span>}
    </div>
  );
}
export function TextArea({ label, id, ...p }: ComponentProps<"textarea"> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <textarea id={id} {...p} className="min-h-24 rounded-[8px] border border-line-strong bg-raised px-3.5 py-3 outline-none focus:border-brand" />
    </div>
  );
}

const TONE = {
  warning: "bg-warning-soft text-warning", info: "bg-info-soft text-info", success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger", brand: "bg-brand-soft text-brand", saffron: "bg-saffron-soft text-saffron", muted: "bg-raised text-muted",
};
export function StatusPill({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return <span className={`inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-semibold ${TONE[m.tone]}`}><span className="size-1.5 rounded-full bg-current" />{m.label}</span>;
}
export function Pill({ tone = "muted", children }: { tone?: keyof typeof TONE; children: ReactNode }) {
  return <span className={`inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-xs font-semibold ${TONE[tone]}`}>{children}</span>;
}
export function Tag({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-6 items-center rounded-full bg-herb-soft px-2.5 text-xs font-semibold text-herb">{children}</span>;
}
export function VegMark({ veg, size = 14 }: { veg: boolean; size?: number }) {
  const c = veg ? "var(--color-veg)" : "var(--color-nonveg)";
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" role="img" aria-label={veg ? "Vegetarian" : "Non-vegetarian"} className="shrink-0">
      <rect x=".75" y=".75" width="12.5" height="12.5" rx="3" fill="none" stroke={c} strokeWidth="1.5" />
      {veg ? <circle cx="7" cy="7" r="2.6" fill={c} /> : <path d="M7 3.6 10.4 9.8H3.6z" fill={c} />}
    </svg>
  );
}
export function Banner({ tone, title, children }: { tone: "warning" | "danger" | "info" | "success"; title: string; children?: ReactNode }) {
  return (
    <div role="status" className={`rounded-[12px] px-4 py-3.5 ${TONE[tone]}`}>
      <p className="text-sm font-semibold">{title}</p>
      {children && <div className="mt-0.5 text-sm text-ink">{children}</div>}
    </div>
  );
}
export function Eyebrow({ children, tone = "saffron" }: { children: ReactNode; tone?: "saffron" | "herb" | "muted" }) {
  const c = tone === "herb" ? "text-herb" : tone === "muted" ? "text-muted" : "text-saffron";
  return <p className={`text-sm font-semibold tracking-wide ${c}`}>{children}</p>;
}
export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-line bg-surface px-6 py-14 text-center">
      <p className="font-display text-2xl">{title}</p>
      {body && <p className="max-w-md text-muted">{body}</p>}
      {action}
    </div>
  );
}
