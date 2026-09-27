import type { Metadata } from "next";
import { Shell } from "@/components/site/Shell";
import { CartView } from "@/components/cart/CartView";
export const metadata: Metadata = { title: "Your cart", robots: { index: false } };
export default function CartPage() {
  return <Shell cartBar={false}><CartView /></Shell>;
}
