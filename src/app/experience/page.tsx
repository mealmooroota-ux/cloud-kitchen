import type { Metadata } from "next";
import { Experience } from "@/components/experience/Experience";
import { Shell } from "@/components/site/Shell";
import { getMenu } from "@/lib/queries";
import { PHOTO } from "@/lib/photos";
import { DEFAULT_SECTIONS, list } from "@/lib/defaults";
import { getHome } from "@/lib/queries";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "The MOOROOTA experience",
  description: "A day in our kitchen, told in motion: from the 5:30 AM market run to your door.",
};

export default async function ExperiencePage() {
  const [{ products }, { sections }] = await Promise.all([getMenu(), getHome()]);
  const withPhoto = products.filter((p) => p.product_media?.some((m) => m.kind === "image")).slice(0, 8)
    .map((p) => ({ name: p.name, slug: p.slug, image: p.product_media!.find((m) => m.kind === "image")!.public_id, veg: p.is_veg }));
  const fallback = [
    { name: "Masala dosa", slug: "masala-dosa", image: PHOTO.masalaDosa, veg: true },
    { name: "South Indian meals", slug: "south-indian-meals", image: PHOTO.bananaLeafMeal, veg: true },
    { name: "Hyderabadi dum biryani", slug: "hyderabadi-dum-biryani", image: PHOTO.biryani, veg: false },
    { name: "Paneer butter masala", slug: "paneer-butter-masala", image: PHOTO.curryBowl, veg: true },
    { name: "Idli sambar", slug: "idli-sambar", image: PHOTO.idli, veg: true },
    { name: "Dal palak with phulkas", slug: "dal-palak-phulka", image: PHOTO.spinachRoti, veg: true },
  ];
  const day = { ...DEFAULT_SECTIONS.homemade, ...(sections.homemade?.content ?? {}) };
  const c = { ...DEFAULT_SECTIONS.experience_page, ...(sections.experience_page?.content ?? {}) };
  return <Shell cartBar={false}><Experience c={c} dishes={withPhoto.length >= 4 ? withPhoto : fallback} timeline={list(day.timeline)} /></Shell>;
}
