import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin/AdminLogin";
export const metadata: Metadata = { title: "Kitchen console sign in", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-ground px-4">
      <div className="w-full max-w-[400px] rounded-[20px] border border-line bg-surface p-8">
        <p className="font-display text-2xl">Cloud Kitchen</p>
        <p className="mb-6 text-sm text-muted">Kitchen console · staff only</p>
        <AdminLogin forbidden={sp.error === "forbidden"} next={sp.next?.startsWith("/admin") ? sp.next : "/admin"} />
      </div>
    </main>
  );
}
