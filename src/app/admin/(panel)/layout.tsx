import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
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
    <div className="flex min-h-dvh flex-col bg-ground lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-line bg-surface p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:border-b-0 lg:border-r">
        <Link href="/admin" className="flex items-center gap-2.5 px-3"><LogoMark size={34} /><span><span className="block font-display text-xl tracking-[0.06em]">MOOROOTA</span><span className="block text-xs text-muted">Kitchen console</span></span></Link>
        <AdminNav role={role} />
        <div className="mt-auto hidden rounded-[12px] bg-raised p-3 text-sm lg:block"><p className="font-semibold">{profile?.full_name || user.email}</p><p className="text-xs text-muted">{role}</p></div>
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
