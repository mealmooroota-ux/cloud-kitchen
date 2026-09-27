"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const ITEMS: { href: string; label: string; roles: Role[] }[] = [
  { href: "/admin", label: "Dashboard", roles: ["ADMIN", "KITCHEN"] },
  { href: "/admin/orders", label: "Live orders", roles: ["ADMIN", "KITCHEN", "DELIVERY"] },
  { href: "/admin/payments", label: "Payments", roles: ["ADMIN"] },
  { href: "/admin/products", label: "Products", roles: ["ADMIN", "KITCHEN"] },
  { href: "/admin/categories", label: "Categories", roles: ["ADMIN"] },
  { href: "/admin/plans", label: "Meal plans", roles: ["ADMIN"] },
  { href: "/admin/customers", label: "Customers & staff", roles: ["ADMIN"] },
  { href: "/admin/delivery", label: "Delivery", roles: ["ADMIN", "KITCHEN", "DELIVERY"] },
  { href: "/admin/content", label: "Site content", roles: ["ADMIN"] },
  { href: "/admin/settings", label: "Settings", roles: ["ADMIN"] },
];
export function AdminNav({ role }: { role: Role }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col">
      {ITEMS.filter((i) => i.roles.includes(role)).map((i) => {
        const on = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined} className={`flex h-11 shrink-0 items-center rounded-[12px] px-3 text-sm font-semibold ${on ? "bg-brand-soft text-ink" : "text-muted hover:bg-raised"}`}>{i.label}</Link>;
      })}
    </nav>
  );
}
