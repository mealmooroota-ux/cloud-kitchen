"use client";
import { saveCategory, deleteCategory } from "@/app/admin/actions";
import { Button } from "@/components/ui";
import { useAction } from "./Forms";
import { inp } from "./ProductEditor";

export function CategoryRow({ c }: { c: { id: string; name: string; slug: string; position: number; is_active: boolean } | null }) {
  const { pending, run, note } = useAction();
  return (
    <form className="flex flex-wrap items-center gap-2 rounded-[12px] border border-line bg-surface p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(() => saveCategory(f)); if (!c) e.currentTarget.reset(); }}>
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <input aria-label="Name" name="name" defaultValue={c?.name} placeholder={c ? "" : "New category name"} required className={`${inp} min-w-40 flex-1`} />
      <input aria-label="Order" name="position" type="number" defaultValue={c?.position ?? 0} className={`${inp} w-20`} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={c?.is_active ?? true} className="size-5 accent-[var(--color-brand)]" />Visible</label>
      <Button type="submit" size="sm" disabled={pending}>{c ? "Save" : "Add"}</Button>
      {c && <Button type="button" size="sm" variant="ghost" onClick={() => confirm(`Delete ${c.name}? Dishes stay but lose this category.`) && run(() => deleteCategory(c.id), "Deleted")}>Delete</Button>}
      {note}
    </form>
  );
}
