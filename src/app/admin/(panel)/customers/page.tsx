import { requireStaff } from "@/lib/auth";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { dateTime } from "@/lib/format";

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase } = await requireStaff(["ADMIN"]);
  let query = supabase.from("profiles").select("id, full_name, phone, email, role, created_at").order("created_at", { ascending: false }).limit(200);
  if (q) query = query.or(`phone.ilike.%${q.replace(/[^\d+]/g, "")}%,full_name.ilike.%${q.replace(/[%,]/g, "")}%`);
  const { data } = await query;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Customers & staff</h1>
      <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search name or phone" aria-label="Search" className="h-10 w-72 rounded-[8px] border border-line-strong bg-raised px-3 text-sm" /></form>
      <p className="text-sm text-muted">To add staff: they sign in once (customers by phone; staff accounts can also be created in Supabase Auth with email + password), then set their role here. KITCHEN manages orders and availability; DELIVERY sees delivery steps; ADMIN has full access.</p>
      <div className="overflow-x-auto rounded-[12px] border border-line bg-surface"><table className="w-full min-w-[640px] text-sm">
        <thead className="bg-raised text-left text-muted"><tr><th className="p-3">Name</th><th className="p-3">Phone / email</th><th className="p-3">Joined</th><th className="p-3">Role</th></tr></thead>
        <tbody>{(data ?? []).map((u) => <tr key={u.id} className="border-t border-line"><td className="p-3">{u.full_name || "—"}</td><td className="tabular p-3 font-mono">{u.phone ? `+${u.phone.replace(/^\+/, "")}` : u.email}</td><td className="p-3 text-muted">{dateTime(u.created_at)}</td><td className="p-3"><RoleSelect id={u.id} role={u.role} /></td></tr>)}</tbody>
      </table></div>
    </div>
  );
}
