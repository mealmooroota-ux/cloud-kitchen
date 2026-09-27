export type Role = "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY";
export type OrderStatus =
  | "PAYMENT_PENDING" | "PAYMENT_PROCESSING" | "PAYMENT_PAID" | "CONFIRMED" | "PREPARING"
  | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "PAYMENT_FAILED" | "CANCELLED" | "REFUNDED";
export type PaymentStatus = "CREATED" | "PENDING" | "PAID" | "FAILED" | "NEEDS_REVIEW" | "REFUNDED" | "EXPIRED";

export interface Category { id: string; name: string; slug: string; description: string | null; position: number; is_active: boolean }
export interface Addon { id: string; group_id: string; name: string; price_paise: number; is_available: boolean; position: number }
export interface AddonGroup { id: string; product_id: string; name: string; min_select: number; max_select: number; position: number; addons: Addon[] }
export interface Media { id: string; product_id: string; public_id: string; kind: "image" | "video"; alt: string | null; position: number }
export interface Product {
  id: string; category_id: string | null; name: string; slug: string; description: string; price_paise: number;
  is_veg: boolean; prep_minutes: number; serves: string | null; calories: number | null; protein_g: number | null;
  tags: string[]; is_available: boolean; is_active: boolean; show_on_home: boolean; in_plan_rotation: boolean;
  daily_limit: number | null; position: number;
  product_media?: Media[]; addon_groups?: AddonGroup[];
}
export interface Settings {
  kitchen_name: string; kitchen_address: string | null; kitchen_lat: number; kitchen_lng: number; delivery_radius_km: number;
  delivery_fee_paise: number; free_delivery_above_paise: number | null; tax_rate_bps: number; packing_minutes: number;
  buffer_minutes: number; min_order_paise: number; is_open: boolean; open_time: string; close_time: string;
  auto_confirm_paid_orders: boolean; support_phone: string | null; support_email: string | null; fssai_license: string | null;
}
export interface Address {
  id: string; user_id: string; label: string; line1: string; line2: string | null; landmark: string | null;
  city: string; postal_code: string; latitude: number; longitude: number; is_default: boolean;
}
export interface Order {
  id: string; order_number: string; user_id: string; kind: "ORDER" | "PLAN"; status: OrderStatus; payment_status: PaymentStatus;
  subtotal_paise: number; delivery_fee_paise: number; discount_paise: number; tax_paise: number; total_paise: number;
  coupon_code: string | null; delivery_address: Record<string, unknown> | null; latitude: number | null; longitude: number | null;
  distance_m: number | null; travel_seconds: number | null; prep_minutes: number | null; eta_is_estimate: boolean;
  estimated_ready_at: string | null; estimated_delivery_at: string | null; notes: string | null; created_at: string; updated_at: string;
}
export interface OrderItem { id: string; order_id: string; product_name: string; is_veg: boolean | null; unit_price_paise: number; quantity: number; addons: { name: string; price_paise: number }[]; line_total_paise: number }
export interface Payment {
  id: string; order_id: string; provider: string; provider_order_id: string; provider_payment_id: string | null; transaction_reference: string | null;
  amount_paise: number; currency: string; status: PaymentStatus; redirect_url: string | null; qr_payload: string | null; expires_at: string | null; paid_at: string | null; created_at: string;
}
export interface MealPlan {
  id: string; slug: string; name: string; label: string; description: string; meals: string[]; features: string[];
  veg_option: boolean; nonveg_option: boolean; delivery_slots: Record<string, string>; skip_cutoff_hours: number; allow_pause: boolean;
  highlight: boolean; show_on_home: boolean; is_active: boolean; position: number; meal_plan_prices?: MealPlanPrice[];
}
export interface MealPlanPrice { id: string; plan_id: string; duration_days: number; label: string; veg_price_paise: number; nonveg_price_paise: number | null; is_visible: boolean }
export interface CookerLayer { key: "vent" | "lid" | "rice" | "pot" | "plate" | "base"; position: number; name: string; title: string; body: string }
