import type { CookerLayer } from "./types";
// Used only when the database has no CMS rows yet (fresh install). Edit live content in Admin > Site content.
export const DEFAULT_SECTIONS: Record<string, Record<string, unknown>> = {
  hero: { eyebrow: "A cloud kitchen in Bengaluru", title: "Slow-cooked.\nFast to you.", body: "Homemade, healthy meals cooked to order in small batches. Order a single dish or get breakfast, lunch and dinner every day with a meal plan.", primaryCta: "Order now", secondaryCta: "See meal plans", imagePublicId: "" },
  cooker: { eyebrow: "Why ours is better", title: "Open it up. Every layer is on purpose.", body: "A real cooker, taken apart as you scroll. Each part is one promise we keep in the kitchen." },
  homemade: { eyebrow: "Homemade, every day", title: "Tastes like someone at home made it. Because someone did.", body: "Our cooks make food the way they make it for their own families: fresh dal every morning, rotis rolled by hand, and nothing out of a packet.", imagePublicId: "", points: [
    { title: "Cold-pressed oils, used lightly", body: "Groundnut and coconut oil, measured, never reused." },
    { title: "Spices ground in our kitchen", body: "Masalas roasted and ground each week, like at home." },
    { title: "No preservatives, colours or MSG", body: "If you wouldn’t add it at home, we don’t either." },
    { title: "Millets, dals and greens daily", body: "Ragi, foxtail millet and seasonal soppu on the menu every day." }] },
  healthy: { eyebrow: "Healthy & light", title: "Good for you, and still delicious", body: "Calories, protein and ingredients are listed on every dish, so you always know what you’re eating.", tag: "Healthy" },
  plans: { eyebrow: "Meal plans", title: "Home food, every day, without the cooking", body: "Pick your meals and we deliver them daily. Pause, skip or change any day from your account." },
  signatures: { eyebrow: "Tonight’s signatures", title: "Dishes we’re known for" },
  how: { steps: [
    { title: "Choose your dishes", body: "Add-ons, spice and notes, priced by our server so totals are always right." },
    { title: "Pay with UPI", body: "We confirm your payment with the bank before the kitchen starts." },
    { title: "Watch it arrive", body: "See it cook, pack and ride, with an ETA that updates on its own." }] },
  closing: { title: "Hungry yet?", cta: "Order now" },
};
export const DEFAULT_ORDER = ["hero", "cooker", "homemade", "healthy", "plans", "signatures", "how", "closing"];
export const DEFAULT_LAYERS: CookerLayer[] = [
  { key: "vent", position: 1, name: "Steam vent", title: "Cooked to order, never reheated", body: "Your dish starts cooking when you order it. Nothing waits under a heat lamp." },
  { key: "lid", position: 2, name: "Lid", title: "Sealed at the pass", body: "Every box is closed and tamper-sealed in the kitchen, and opened only by you." },
  { key: "rice", position: 3, name: "Rice", title: "Bought fresh every morning", body: "Vegetables, paneer and grains arrive daily. What we don’t use, we don’t serve tomorrow." },
  { key: "pot", position: 4, name: "Inner pot", title: "Slow-cooked in small batches", body: "Gravies simmer for hours in small pots, so flavour builds instead of being rushed." },
  { key: "plate", position: 5, name: "Heating plate", title: "A hygiene-certified kitchen", body: "Temperature-logged, inspected and cleaned to a schedule you can ask to see." },
  { key: "base", position: 6, name: "Base", title: "Tracked from stove to door", body: "Live status and a routed ETA, so you know exactly when to set the table." },
];
