import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { MediaManager } from "@/components/admin/MediaManager";
import type { Product } from "@/lib/types";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaff(["ADMIN"]);
  const { data: cats } = await supabase.from("categories").select("id, name").order("position");
  let product: Product | null = null;
  if (id !== "new") {
    const { data } = await supabase.from("products").select("*, product_media(*), addon_groups(*, addons(*))").eq("id", id).maybeSingle();
    if (!data) notFound();
    product = data as Product;
    product.product_media?.sort((a, b) => a.position - b.position);
    product.addon_groups?.sort((a, b) => a.position - b.position).forEach((g) => g.addons.sort((a, b) => a.position - b.position));
  }
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{product ? `Edit ${product.name}` : "New dish"}</h1>
      <ProductEditor product={product} categories={cats ?? []} />
      {product ? <MediaManager productId={product.id} media={product.product_media ?? []} /> : <p className="text-sm text-muted">Save the dish first, then add photos and videos.</p>}
    </div>
  );
}
