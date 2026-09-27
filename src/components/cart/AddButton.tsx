"use client";
import Link from "next/link";
import { useState } from "react";
import { cart } from "./store";
import { btnClass } from "@/components/ui";

/** Quick add for dishes without required choices; otherwise opens the dish page to choose add-ons. */
export function AddButton({ product, hasRequiredChoices, size = "md" }: {
  product: { id: string; slug: string; name: string; is_veg: boolean; price_paise: number; is_available: boolean; imageId?: string | null };
  hasRequiredChoices: boolean; size?: "sm" | "md";
}) {
  const [added, setAdded] = useState(false);
  if (!product.is_available) return <span className="text-xs font-semibold text-warning">Sold out</span>;
  if (hasRequiredChoices) return <Link href={`/menu/${product.slug}`} className={btnClass("primary", size)}>Choose</Link>;
  return (
    <button type="button" className={btnClass("primary", size)} aria-live="polite"
      onClick={() => { cart.add({ productId: product.id, name: product.name, isVeg: product.is_veg, unitPaise: product.price_paise, addonIds: [], addonNames: [], imageId: product.imageId }); setAdded(true); setTimeout(() => setAdded(false), 1400); }}>
      {added ? "Added" : "Add"}
    </button>
  );
}
