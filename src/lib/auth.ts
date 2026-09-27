import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase, user: null, role: null as Role | null };
  const { data: profile } = await supabase.from("profiles").select("role, full_name, phone").eq("id", data.user.id).maybeSingle();
  return { supabase, user: data.user, role: (profile?.role ?? "CUSTOMER") as Role, profile };
}

export async function requireUser(next = "/") {
  const s = await getSessionUser();
  if (!s.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return s as typeof s & { user: NonNullable<typeof s.user> };
}

export async function requireStaff(roles: Role[] = ["ADMIN", "KITCHEN", "DELIVERY"]) {
  const s = await getSessionUser();
  if (!s.user) redirect("/admin/login");
  if (!s.role || !roles.includes(s.role)) redirect("/admin/login?error=forbidden");
  return s as typeof s & { user: NonNullable<typeof s.user>; role: Role };
}
