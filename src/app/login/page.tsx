import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { PhoneLogin } from "@/components/site/PhoneLogin";
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return <Shell cartBar={false}><div className="mx-auto max-w-[440px] px-4 py-12 md:py-20"><PhoneLogin next={safe} /></div></Shell>;
}
