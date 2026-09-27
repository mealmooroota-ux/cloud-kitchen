import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { ResetPassword } from "@/components/auth/ResetPassword";
export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };
export default function Page() {
  return <Shell cartBar={false}><div className="mx-auto max-w-[440px] px-4 py-12 md:py-20"><ResetPassword /></div></Shell>;
}
