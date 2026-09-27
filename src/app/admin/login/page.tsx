import type { Metadata } from "next";
import { PhoneLogin } from "@/components/site/PhoneLogin";
import { Banner } from "@/components/ui";
import { Wordmark } from "@/components/site/Wordmark";

export const metadata: Metadata = { title: "Kitchen console sign in", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/admin") ? sp.next : "/admin";
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-ground px-4 py-10">
      <div className="flex w-full max-w-[440px] flex-col gap-6 rounded-[24px] border border-line bg-surface p-8">
        <div><Wordmark /><p className="mt-3 text-sm text-muted">Kitchen console · staff only</p></div>
        {sp.error === "forbidden" && <Banner tone="danger" title="This number doesn’t have kitchen access">An admin can give you a role in Admin → Customers & staff. The owner’s number is set with ADMIN_PHONES in Vercel.</Banner>}
        <PhoneLogin next={next} heading="Staff sign in" subheading="Use your registered mobile number. We’ll text you a one-time code." />
      </div>
    </main>
  );
}
