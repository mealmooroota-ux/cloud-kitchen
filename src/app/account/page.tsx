import Link from "next/link";
import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { AddressBook } from "@/components/site/AddressBook";
import { Button } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { signOut, updateName, updatePhone } from "./actions";
import { displayPhone } from "@/lib/phone";
import type { Address } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function AccountPage() {
  const { supabase, user, profile } = await requireUser("/account");
  const settings = await getSettings();
  const [{ data: addresses }, { count }] = await Promise.all([
    supabase.from("addresses").select("*").order("is_default", { ascending: false }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["ACTIVE", "PAUSED"]),
  ]);
  return (
    <Shell>
      <div className="mx-auto flex max-w-[760px] flex-col gap-10 px-4 pb-24 pt-8 md:pt-12">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-[36px] md:text-[48px]">Your account</h1>
          <form action={async () => { "use server"; await signOut(); }}><Button variant="ghost" size="sm" type="submit">Sign out</Button></form>
        </div>
        <nav className="grid gap-3 sm:grid-cols-3">
          <Link href="/orders" className="rounded-[20px] border border-line bg-surface p-5 font-semibold hover:border-line-strong">Order history</Link>
          <Link href="/account/plan" className="rounded-[20px] border border-line bg-surface p-5 font-semibold hover:border-line-strong">My meal plan{count ? <span className="block text-sm font-normal text-muted">{count} active</span> : null}</Link>
          <Link href="/plans" className="rounded-[20px] border border-line bg-surface p-5 font-semibold hover:border-line-strong">Start a meal plan</Link>
        </nav>
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="text-sm text-muted">Signed in as <span className="font-semibold text-ink">{user.email}</span></p>
          <form action={updateName} className="flex gap-2">
            <label htmlFor="full_name" className="sr-only">Your name</label>
            <input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Your name" className="h-12 flex-1 rounded-[8px] border border-line-strong bg-raised px-3.5" />
            <Button type="submit" variant="secondary" size="lg">Save</Button>
          </form>
          <form action={updatePhone} className="flex gap-2">
            <label htmlFor="phone" className="sr-only">Mobile number for deliveries</label>
            <input id="phone" name="phone" inputMode="tel" defaultValue={profile?.phone ? displayPhone(profile.phone) : ""} placeholder="Mobile number for deliveries" className="h-12 flex-1 rounded-[8px] border border-line-strong bg-raised px-3.5" />
            <Button type="submit" variant="secondary" size="lg">Save</Button>
          </form>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Addresses</h2>
          <AddressBook addresses={(addresses ?? []) as Address[]} kitchen={{ lat: settings.kitchen_lat, lng: settings.kitchen_lng }} radiusKm={Number(settings.delivery_radius_km)} />
        </section>
      </div>
    </Shell>
  );
}
