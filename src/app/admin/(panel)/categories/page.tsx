import { requireStaff } from "@/lib/auth";
import { CategoryRow } from "@/components/admin/CategoryRow";

export default async function Categories() {
  const { supabase } = await requireStaff(["ADMIN"]);
  const { data } = await supabase.from("categories").select("*").order("position");
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <div className="flex flex-col gap-2">
        {(data ?? []).map((c) => <CategoryRow key={c.id} c={c} />)}
        <CategoryRow c={null} />
      </div>
    </div>
  );
}
