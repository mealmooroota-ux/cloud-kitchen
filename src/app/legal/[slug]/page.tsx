import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { getSettings } from "@/lib/settings";

// Payment gateways (PhonePe, Razorpay) require these pages before approving a merchant. Replace the [BRACKETS].
const PAGES: Record<string, { title: string; body: (s: { name: string; phone: string; email: string; address: string }) => string[] }> = {
  terms: { title: "Terms of service", body: (s) => [
    `These terms apply to orders placed with ${s.name} ([REGISTERED BUSINESS NAME]) through this website.`,
    "Prices, taxes and delivery fees are shown before you pay and are calculated by our server at the time of order.",
    "An order is confirmed only after we receive confirmation of your payment from our payment provider or bank.",
    "Meal plans run for the period you buy. Meals can be skipped or the plan paused as described on the plan page.",
    "We may cancel an order we cannot fulfil; in that case you receive a full refund.",
    "These terms are governed by the laws of India, with courts in Bengaluru, Karnataka having jurisdiction." ] },
  privacy: { title: "Privacy policy", body: (s) => [
    "We collect your phone number (to sign you in), your name, delivery addresses and location (to check delivery and estimate arrival), and your order history.",
    "Payments are processed by our payment provider. We never see or store your card, UPI PIN or bank credentials.",
    "We share your address and phone number only with the person delivering your order.",
    "We do not sell your data. You can ask us to delete your account and data at any time.",
    `Contact: ${s.email} · ${s.phone}` ] },
  refunds: { title: "Refunds and cancellation", body: (s) => [
    "You can cancel an order for a full refund until the kitchen starts preparing it.",
    "If your food is missing, wrong or not up to standard, contact us within 2 hours of delivery and we will refund or replace it.",
    "Meal plans: unused days can be refunded pro rata on request; skipped meals are credited as described on the plan page.",
    "Refunds go back to the original payment method within 5–7 business days.",
    `Contact: ${s.phone} · ${s.email}` ] },
  delivery: { title: "Delivery policy", body: (s) => [
    `We deliver within our delivery area around our kitchen in Bengaluru. Your address is checked before you pay.`,
    "Estimated arrival times are calculated from cooking time and real road routing, and update as your order progresses.",
    "Delivery fees are shown at checkout. Meal plan deliveries are included in the plan price.",
    `Kitchen address: ${s.address}` ] },
  contact: { title: "Contact us", body: (s) => [
    `${s.name}`, `Phone: ${s.phone}`, `Email: ${s.email}`, `Address: ${s.address}`, "Legal entity: [REGISTERED BUSINESS NAME] · GSTIN: [GSTIN]" ] },
};

export function generateStaticParams() { return Object.keys(PAGES).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = PAGES[(await params).slug]; return { title: p?.title ?? "Not found" };
}
export default async function Legal({ params }: { params: Promise<{ slug: string }> }) {
  const page = PAGES[(await params).slug];
  if (!page) notFound();
  const s = await getSettings();
  const lines = page.body({ name: s.kitchen_name, phone: s.support_phone ?? "[SUPPORT PHONE]", email: s.support_email ?? "[SUPPORT EMAIL]", address: s.kitchen_address ?? "[KITCHEN ADDRESS]" });
  return (
    <Shell>
      <article className="mx-auto flex max-w-[680px] flex-col gap-4 px-4 pb-24 pt-10">
        <h1 className="font-display text-[40px]">{page.title}</h1>
        {lines.map((l) => <p key={l} className="text-[17px] leading-7 text-muted">{l}</p>)}
      </article>
    </Shell>
  );
}
