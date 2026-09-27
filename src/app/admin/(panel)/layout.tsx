import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { KitchenToggle } from "@/components/admin/KitchenToggle";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kitchen console", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { role, profile, user } = await requireStaff();
  const settings = await getSettings();
  return (
    <div className="flex min-h-dvh flex-col bg-ground md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-line bg-surface p-4 md:sticky md:top-0 md:h-dvh md:w-60 md:border-b-0 md:border-r">
        <Link href="/admin" className="px-3"><span className="font-display text-xl">Cloud Kitchen</span><span className="block text-xs text-muted">Kitchen console</span></Link>
        <AdminNav role={role} />
        <div className="mt-auto hidden rounded-[12px] bg-raised p-3 text-sm md:block"><p className="font-semibold">{profile?.full_name || user.email}</p><p className="text-xs text-muted">{role}</p></div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center justify-end gap-3 border-b border-line bg-surface px-4 md:px-8">
          <KitchenToggle open={settings.is_open} canToggle={role === "ADMIN" || role === "KITCHEN"} />
        </div>
        <main id="main" className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
