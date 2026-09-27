import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { AvailabilityToggle } from "@/components/admin/AvailabilityToggle";
import { VegMark } from "@/components/ui";
import { rupees } from "@/lib/format";

export default async function Products() {
  const { supabase, role } = await requireStaff(["ADMIN", "KITCHEN"]);
  const { data } = await supabase.from("products").select("id, name, price_paise, is_veg, is_available, is_active, categories(name), product_media(id)").order("position");
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Products</h1>{role === "ADMIN" && <Link href="/admin/products/new" className="rounded-[12px] bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand">New dish</Link>}</div>
      <div className="overflow-x-auto rounded-[12px] border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-raised text-left text-muted"><tr><th className="p-3">Dish</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Photos</th><th className="p-3">Available now</th></tr></thead>
          <tbody>{(data ?? []).map((p) => (
            <tr key={p.id} className={`border-t border-line ${p.is_active ? "" : "opacity-50"}`}>
              <td className="p-3"><span className="flex items-center gap-2"><VegMark veg={p.is_veg} />{role === "ADMIN" ? <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">{p.name}</Link> : <span className="font-semibold">{p.name}</span>}{!p.is_active && <span className="text-xs">(hidden)</span>}</span></td>
              <td className="p-3 text-muted">{(p.categories as unknown as { name: string } | null)?.name ?? "—"}</td>
              <td className="tabular p-3 font-mono">{rupees(p.price_paise)}</td>
              <td className="p-3">{(p.product_media as unknown[]).length || <span className="text-warning">None</span>}</td>
              <td className="p-3"><AvailabilityToggle id={p.id} available={p.is_available} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
