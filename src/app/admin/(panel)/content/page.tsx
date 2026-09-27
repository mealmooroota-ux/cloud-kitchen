import { requireStaff } from "@/lib/auth";
import { SectionEditor, LayersEditor } from "@/components/admin/ContentEditor";
import { DEFAULT_LAYERS, DEFAULT_ORDER, DEFAULT_SECTIONS } from "@/lib/defaults";

export default async function Content() {
  const { supabase } = await requireStaff(["ADMIN"]);
  const [{ data: rows }, { data: layers }] = await Promise.all([supabase.from("site_sections").select("*"), supabase.from("cooker_layers").select("*").order("position")]);
  const sections = DEFAULT_ORDER.map((key, i) => {
    const r = rows?.find((x) => x.key === key);
    return { key, enabled: r?.is_enabled ?? true, position: r?.position ?? i + 1, content: { ...DEFAULT_SECTIONS[key], ...(r?.content ?? {}) } };
  }).sort((a, b) => a.position - b.position);
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div><h1 className="text-2xl font-semibold">Site content</h1><p className="text-sm text-muted">Every homepage section is edited here. Changes go live within a minute. Use the order number to rearrange sections.</p></div>
      {sections.map((s) => <SectionEditor key={s.key} sectionKey={s.key} enabled={s.enabled} position={s.position} content={s.content} />)}
      <LayersEditor layers={layers?.length ? layers : DEFAULT_LAYERS} />
    </div>
  );
}
