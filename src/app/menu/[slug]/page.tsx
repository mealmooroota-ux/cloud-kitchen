import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/site/Shell";
import { DishImage } from "@/components/ui/DishImage";
import { Tag, VegMark } from "@/components/ui";
import { ProductConfigurator } from "@/components/cart/ProductConfigurator";
import { getProduct } from "@/lib/queries";
import { cld } from "@/lib/cloudinary";

export const revalidate = 600;
// Dish pages are built on first visit, then served from the cache (refreshed when the dish is edited).
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Dish not found" };
  const img = p.product_media?.find((m) => m.kind === "image");
  return { title: p.name, description: p.description, openGraph: { images: img ? [cld(img.public_id, { w: 1200, h: 630 })] : undefined } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const images = (p.product_media ?? []).filter((m) => m.kind === "image");
  const video = (p.product_media ?? []).find((m) => m.kind === "video");
  return (
    <Shell cartBar={false}>
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 pb-32 pt-6 md:grid-cols-[minmax(0,620px)_1fr] md:gap-16 md:px-8 md:pt-10">
        <div className="flex flex-col gap-3">
          <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/menu" className="hover:text-ink">Menu</Link> / <span className="text-ink">{p.name}</span></nav>
          {video ? (
            <video className="aspect-[4/5] w-full rounded-[32px] bg-raised object-cover" autoPlay muted loop playsInline preload="none"
              poster={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "zu6iogvj"}/video/upload/so_0,f_auto,q_auto,w_900/${video.public_id}.jpg`}>
              <source src={cld(video.public_id, { w: 900, video: true })} />
            </video>
          ) : (
            <DishImage publicId={images[0]?.public_id} name={p.name} sizes="(min-width: 768px) 620px, 100vw" priority aspect="aspect-square md:aspect-[4/5]" className="rounded-[32px]" />
          )}
          {images.length > 1 && <div className="grid grid-cols-4 gap-3">{images.slice(1, 5).map((m) => <DishImage key={m.id} publicId={m.public_id} name={m.alt ?? p.name} sizes="140px" aspect="aspect-square" className="rounded-[12px]" />)}</div>}
        </div>
        <div className="flex flex-col gap-5 md:pt-9">
          <div className="flex flex-wrap items-center gap-2"><VegMark veg={p.is_veg} size={16} /><span className="text-sm text-muted">{p.is_veg ? "Vegetarian" : "Non-vegetarian"}</span>{p.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
          <h1 className="font-display text-[38px] leading-[1.02] md:text-[56px]">{p.name}</h1>
          <p className="text-[17px] text-muted md:text-lg">{p.description}</p>
          <ul className="flex flex-wrap gap-2 text-[13px]">
            <li className="rounded-full bg-raised px-3 py-1.5">{p.prep_minutes} min</li>
            {p.serves && <li className="rounded-full bg-raised px-3 py-1.5">Serves {p.serves}</li>}
            {p.calories != null && <li className="rounded-full bg-raised px-3 py-1.5">{p.calories} kcal</li>}
            {p.protein_g != null && <li className="rounded-full bg-raised px-3 py-1.5">{p.protein_g} g protein</li>}
          </ul>
          <ProductConfigurator product={{ id: p.id, name: p.name, is_veg: p.is_veg, price_paise: p.price_paise, is_available: p.is_available, imageId: images[0]?.public_id ?? null }} groups={p.addon_groups ?? []} />
        </div>
      </div>
    </Shell>
  );
}
