import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { AuthForm } from "@/components/auth/AuthForm";
import { Banner } from "@/components/ui";
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <Shell cartBar={false}>
      <div className="mx-auto flex max-w-[440px] flex-col gap-6 px-4 py-12 md:py-20">
        {error === "link" && <Banner tone="warning" title="That link has expired or was already used">Sign in below, or request a new link.</Banner>}
        <AuthForm next={safe} />
      </div>
    </Shell>
  );
}
