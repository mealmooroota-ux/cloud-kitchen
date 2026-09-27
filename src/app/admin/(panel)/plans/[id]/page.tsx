import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { PlanEditor, PlanMenuGrid } from "@/components/admin/PlanEditor";
import type { MealPlan } from "@/lib/types";

export default async function EditPlan({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ week?: string }> }) {
  const { id } = await params;
  const week = Math.min(4, Math.max(1, Number((await searchParams).week ?? 1)));
  const { supabase } = await requireStaff(["ADMIN"]);
  let plan: MealPlan | null = null;
  let menu: { weekday: number; meal: string; product_id: string | null; custom_name: string | null }[] = [];
  const { data: dishes } = await supabase.from("products").select("id, name").eq("in_plan_rotation", true).eq("is_active", true).order("name");
  if (id !== "new") {
    const { data } = await supabase.from("meal_plans").select("*, meal_plan_prices(*)").eq("id", id).maybeSingle();
    if (!data) notFound();
    plan = data as MealPlan;
    menu = (await supabase.from("plan_menu").select("weekday, meal, product_id, custom_name").eq("plan_id", id).eq("week", week)).data ?? [];
  }
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{plan ? `Edit ${plan.name}` : "New meal plan"}</h1>
      <PlanEditor plan={plan} />
      {plan && <PlanMenuGrid planId={plan.id} meals={plan.meals} week={week} menu={menu} dishes={dishes ?? []} />}
    </div>
  );
}
