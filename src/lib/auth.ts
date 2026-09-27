import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

export async function getSessionUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase, user: null, role: null as Role | null };
  const { data: profile } = await supabase.from("profiles").select("role, full_name, phone").eq("id", data.user.id).maybeSingle();
  let role = (profile?.role ?? "CUSTOMER") as Role;
  // Bootstrap admins: a verified phone listed in ADMIN_PHONES (Vercel env) is promoted to ADMIN.
  const phone = (data.user.phone ?? "").replace(/\D/g, "").slice(-10);
  if (role !== "ADMIN" && phone && data.user.phone_confirmed_at && env.adminPhones.includes(phone)) {
    try {
      await createAdminClient().from("profiles").upsert({ id: data.user.id, phone: data.user.phone, role: "ADMIN" });
      role = "ADMIN";
      log("info", "admin.bootstrap_promoted", { userId: data.user.id });
    } catch { /* service key missing: stays customer */ }
  }
  return { supabase, user: data.user, role, profile };
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
