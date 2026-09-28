import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { Banner } from "@/components/ui";
import { Wordmark } from "@/components/site/Wordmark";

export const metadata: Metadata = { title: "Kitchen console sign in", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/admin") ? sp.next : "/admin";
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-ground px-4 py-10">
      <div className="flex w-full max-w-[460px] flex-col gap-6 rounded-[24px] border border-line bg-surface p-5 sm:p-8">
        <div><Wordmark /><p className="mt-3 text-sm text-muted">Kitchen console · staff only</p></div>
        {sp.error === "forbidden" && <Banner tone="danger" title="This account doesn’t have kitchen access">An admin can give you a role in Admin → Customers &amp; staff. The owner’s email is set with ADMIN_EMAILS in Vercel.</Banner>}
        <AuthForm next={next} staff />
      </div>
    </main>
  );
}
