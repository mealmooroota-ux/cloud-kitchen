"use client";
import { saveCoupon, saveSettings } from "@/app/admin/actions";
import type { Settings } from "@/lib/types";
import { Button } from "@/components/ui";
import { useAction } from "./Forms";
import { Check, inp, L } from "./ProductEditor";

export function SettingsForm({ s }: { s: Settings }) {
  const { pending, run, note } = useAction();
  return (
    <form className="flex flex-col gap-5 rounded-[12px] border border-line bg-surface p-5" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(() => saveSettings(f)); }}>
      <h2 className="font-semibold">Kitchen</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <L label="Kitchen name"><input name="kitchen_name" defaultValue={s.kitchen_name} className={inp} /></L>
        <L label="FSSAI licence number"><input name="fssai_license" defaultValue={s.fssai_license ?? ""} className={inp} /></L>
        <L label="Kitchen address" className="md:col-span-2"><input name="kitchen_address" defaultValue={s.kitchen_address ?? ""} className={inp} /></L>
        <L label="Kitchen latitude"><input name="kitchen_lat" defaultValue={s.kitchen_lat} className={inp} /></L>
        <L label="Kitchen longitude"><input name="kitchen_lng" defaultValue={s.kitchen_lng} className={inp} /></L>
        <L label="Support phone"><input name="support_phone" defaultValue={s.support_phone ?? ""} className={inp} /></L>
        <L label="Support email"><input name="support_email" defaultValue={s.support_email ?? ""} className={inp} /></L>
      </div>
      <h2 className="font-semibold">Delivery & pricing</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <L label="Delivery radius (km)"><input name="delivery_radius_km" defaultValue={s.delivery_radius_km} className={inp} /></L>
        <L label="Delivery fee (₹)"><input name="delivery_fee" defaultValue={s.delivery_fee_paise / 100} className={inp} /></L>
        <L label="Free delivery above (₹)"><input name="free_delivery_above" defaultValue={s.free_delivery_above_paise != null ? s.free_delivery_above_paise / 100 : ""} className={inp} /></L>
        <L label="Minimum order (₹)"><input name="min_order" defaultValue={s.min_order_paise / 100} className={inp} /></L>
        <L label="GST %"><input name="tax_rate" defaultValue={s.tax_rate_bps / 100} className={inp} /></L>
        <L label="Packing minutes"><input name="packing_minutes" type="number" defaultValue={s.packing_minutes} className={inp} /></L>
        <L label="Delivery buffer minutes"><input name="buffer_minutes" type="number" defaultValue={s.buffer_minutes} className={inp} /></L>
      </div>
      <h2 className="font-semibold">Hours</h2>
      <div className="flex flex-wrap items-end gap-4">
        <L label="Opens"><input name="open_time" type="time" defaultValue={s.open_time.slice(0, 5)} className={inp} /></L>
        <L label="Closes"><input name="close_time" type="time" defaultValue={s.close_time.slice(0, 5)} className={inp} /></L>
        <Check name="is_open" label="Accepting orders" defaultChecked={s.is_open} />
        <Check name="auto_confirm_paid_orders" label="Auto-accept paid orders" defaultChecked={s.auto_confirm_paid_orders} />
      </div>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>{note}</div>
    </form>
  );
}
export function CouponForm() {
  const { pending, run, note } = useAction();
  return (
    <form className="flex flex-wrap items-end gap-2 border-t border-line pt-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(() => saveCoupon(f)); }}>
      <L label="Code"><input name="code" required className={`${inp} w-32 uppercase`} /></L>
      <L label="Type"><select name="kind" className={`${inp} w-32`}><option value="PERCENT">% off</option><option value="FLAT">₹ off</option></select></L>
      <L label="Value"><input name="value" required className={`${inp} w-24`} /></L>
      <L label="Min order ₹"><input name="min_subtotal" defaultValue="0" className={`${inp} w-24`} /></L>
      <L label="Max discount ₹"><input name="max_discount" className={`${inp} w-24`} /></L>
      <L label="Uses"><input name="usage_limit" className={`${inp} w-20`} /></L>
      <Check name="is_active" label="Active" defaultChecked />
      <Button type="submit" size="sm" disabled={pending}>Save coupon</Button>{note}
    </form>
  );
}
