import type { OrderStatus } from "./types";

/** Mirror of order_transition_allowed() in SQL. The database is the authority; this drives UI only. */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PAYMENT_PENDING: ["PAYMENT_PROCESSING", "PAYMENT_PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAYMENT_PROCESSING: ["PAYMENT_PAID", "PAYMENT_FAILED"],
  PAYMENT_FAILED: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PAID: ["CONFIRMED", "CANCELLED", "REFUNDED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export const STAFF_NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  PAYMENT_PAID: { to: "CONFIRMED", label: "Accept order" },
  CONFIRMED: { to: "PREPARING", label: "Start preparing" },
  PREPARING: { to: "READY_FOR_PICKUP", label: "Mark ready" },
  READY_FOR_PICKUP: { to: "OUT_FOR_DELIVERY", label: "Hand to rider" },
  OUT_FOR_DELIVERY: { to: "DELIVERED", label: "Mark delivered" },
};

export const STATUS_META: Record<OrderStatus, { label: string; tone: "warning" | "info" | "success" | "danger" | "brand" | "saffron" | "muted" }> = {
  PAYMENT_PENDING: { label: "Waiting for payment", tone: "warning" },
  PAYMENT_PROCESSING: { label: "Verifying payment", tone: "info" },
  PAYMENT_PAID: { label: "Payment received", tone: "success" },
  CONFIRMED: { label: "Order confirmed", tone: "brand" },
  PREPARING: { label: "Cooking now", tone: "brand" },
  READY_FOR_PICKUP: { label: "Packed and ready", tone: "saffron" },
  OUT_FOR_DELIVERY: { label: "On the way", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "success" },
  PAYMENT_FAILED: { label: "Payment failed", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "muted" },
};

export const TIMELINE: OrderStatus[] = ["PAYMENT_PAID", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"];
