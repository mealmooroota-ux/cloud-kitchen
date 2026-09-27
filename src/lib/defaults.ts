import type { CookerLayer } from "./types";
import { PHOTO } from "./photos";

// Default copy. Used when the database has no CMS row for a section yet. Everything here is editable in Admin > Site content.
export type Item = { title: string; body: string };
export const DEFAULT_SECTIONS: Record<string, Record<string, unknown>> = {
  hero: {
    eyebrow: "Home-cooked in Bengaluru",
    title: "Your everyday meal,\ncooked like home.",
    body: "MOOROOTA cooks fresh, balanced Indian meals every day in small batches: soft phulkas, slow-cooked dals, millet bowls and weekend biryani. Order tonight’s dinner, or let us take care of breakfast, lunch and dinner with a meal plan.",
    primaryCta: "Order now", secondaryCta: "Explore meal plans",
    imagePublicId: PHOTO.heroThali,
    chips: "Cooked to order, Veg & non-veg, Breakfast · lunch · dinner, Millets every day",
  },
  marquee: { label: "On the stove today" },
  cooker: {
    eyebrow: "Why MOOROOTA is different",
    title: "Open it up. Every layer is on purpose.",
    body: "A real cooker, taken apart as you scroll. Each part stands for one promise our kitchen keeps, every single day.",
  },
  homemade: {
    eyebrow: "Our food",
    title: "Tastes like someone at home made it. Because someone did.",
    body: "Our cooks make food the way they make it for their own families. Dal is soaked the night before and tempered fresh. Rotis are rolled by hand. Masalas are roasted and ground in our kitchen every week, never poured from a packet.",
    body2: "We cook the everyday food of Karnataka, Andhra, Tamil Nadu, Kerala and the North: the dishes you grew up eating, not restaurant versions. Less oil, less cream, more vegetables, and the same honest taste every day.",
    imagePublicId: PHOTO.kitchenCrew,
    timelineTitle: "A day in our kitchen",
    timeline: [
      { title: "5:30 AM", body: "Vegetables, greens and paneer arrive, checked and washed." },
      { title: "6:30 AM", body: "Batter fermented overnight goes on the tawa for breakfast." },
      { title: "9:30 AM", body: "Dals go on the stove. The day’s masalas are roasted and ground." },
      { title: "11:30 AM", body: "Lunch is plated to order and sealed at the pass." },
      { title: "4:00 PM", body: "Deep clean and temperature checks between services." },
      { title: "7:00 PM", body: "Dinner cooks in small batches, so it reaches you hot." },
    ],
    points: [
      { title: "Cold-pressed oils, used lightly", body: "Groundnut and coconut oil, measured, never reused." },
      { title: "Spices ground in our kitchen", body: "Masalas roasted and ground each week, like at home." },
      { title: "No preservatives, colours or MSG", body: "If you wouldn’t add it at home, we don’t either." },
      { title: "Millets, dals and greens daily", body: "Ragi, foxtail millet and seasonal soppu on the menu every day." },
    ],
  },
  plate: {
    eyebrow: "What’s on your plate",
    title: "A complete meal, the way it should be.",
    body: "Every MOOROOTA lunch and dinner is a balanced plate: protein, fibre, good carbs and something fresh. This is what a typical everyday thali holds.",
    imagePublicId: PHOTO.silverThali,
    items: [
      { title: "Dal of the day", body: "Toor, moong or masoor, rotating daily. Your protein." },
      { title: "Seasonal sabzi", body: "One dry, one with gravy, from what came in fresh that morning." },
      { title: "Phulkas or rice", body: "Hand-rolled whole-wheat phulkas, rice, or millet on some days." },
      { title: "Curd and salad", body: "Curd set in our kitchen overnight, with a crunchy kosambari." },
      { title: "Chutney or pickle", body: "Made in-house in small jars, like at home." },
      { title: "Something sweet", body: "On some days, a small payasam or kheer." },
    ],
    note: "Calories and protein are listed on every dish in the menu.",
  },
  healthy: {
    eyebrow: "Healthy & light",
    title: "Good for you, and still delicious.",
    body: "Millet khichdi, sprout bowls, ragi mudde and lentil chillas: light food that keeps you full. Calories, protein and ingredients are listed on every dish, so you always know what you’re eating.",
    tag: "Healthy",
  },
  plans: {
    eyebrow: "Meal plans",
    title: "Your everyday meal, every single day.",
    body: "Stop thinking about what’s for lunch. Pick a plan and we cook and deliver breakfast, lunch or dinner to your door daily, with a menu that changes every day so you never get bored.",
  },
  plans_how: {
    eyebrow: "How meal plans work",
    title: "Set it up once. Eat well all month.",
    steps: [
      { title: "Choose your plan", body: "Two meals, full day, or light & healthy. Weekly or monthly, veg or non-veg." },
      { title: "Tell us your taste", body: "Less spicy, no onion-garlic, Jain or no dairy. Pick a start date and address." },
      { title: "We cook and deliver daily", body: "A rotating four-week menu, delivered hot and sealed in the time slot you chose." },
      { title: "Skip or pause anytime", body: "Travelling or eating out? Skip a meal or pause from your account. Paused days are added to the end." },
    ],
    perks: "No delivery fee on plans, New menu every day, Skip before 9 PM the night before, Pause and resume anytime",
  },
  signatures: { eyebrow: "Kitchen favourites", title: "Dishes we’re known for" },
  how: {
    eyebrow: "Ordering takes a minute",
    title: "From our stove to your door.",
    steps: [
      { title: "Choose your meal", body: "Browse today’s menu, pick add-ons and leave a note for the cook: less spicy, no onion, extra chutney." },
      { title: "Pay securely", body: "Your order goes to the kitchen the moment your payment is confirmed. The price you see is the price you pay." },
      { title: "Track it live", body: "Watch your food go from the stove to the rider, with an arrival time that updates by itself." },
    ],
  },
  faq: {
    eyebrow: "Questions",
    title: "Good to know",
    items: [
      { title: "Where do you deliver?", body: "Across our delivery area in Bengaluru. Add your address at checkout and we’ll tell you instantly whether we reach you." },
      { title: "Is the food really homemade?", body: "Yes. It’s cooked fresh in small batches by our cooks, with home recipes, hand-rolled rotis and masalas ground in our kitchen. No frozen gravies, no reheating." },
      { title: "How healthy is it?", body: "We cook with cold-pressed oils in small amounts, add no preservatives, colours or MSG, and put millets, dals and greens on the menu every day. Calories and protein are listed on each dish." },
      { title: "Can I skip or pause my meal plan?", body: "Yes. Skip any meal or pause the whole plan from your account before the cut-off. Paused days are added to the end, so you never lose a meal you paid for." },
      { title: "Do you have Jain, no onion-garlic or less-spicy food?", body: "Yes. Choose your preferences when you start a plan, or leave a note for the cook on any order." },
      { title: "How do I pay?", body: "Securely online at checkout. Your order is confirmed as soon as the payment goes through." },
      { title: "What if something is wrong with my order?", body: "Tell us within two hours of delivery and we’ll replace it or refund you. Our refund policy has the details." },
    ],
  },
  closing: {
    title: "Hungry yet?",
    body: "Tonight’s menu is ready and the stove is on. Order a dish in under a minute, or start a meal plan and never think about what’s for lunch again.",
    cta: "Order now", secondaryCta: "Start a meal plan",
    promises: "Cooked to order, Sealed at the kitchen, Tracked to your door",
  },
  kitchen_page: {
    eyebrow: "Our kitchen",
    title: "A small kitchen that cooks like a home.",
    body: "MOOROOTA started with one simple idea: people in Bengaluru deserve everyday food that tastes like home, made honestly and delivered on time.",
    imagePublicId: PHOTO.kitchenCrew,
    story: [
      { title: "Why we started", body: "Most of us moved to this city for work and left our mothers’ kitchens behind. Ordering in meant rich restaurant food that felt heavy by Wednesday. Cooking every day meant giving up our evenings." },
      { title: "What we built", body: "So we built the kitchen we wanted to eat from: a small team of home cooks, a short menu that changes daily, and recipes from Karnataka, Andhra, Tamil Nadu, Kerala and the North, cooked the way they are at home." },
      { title: "How we keep it that way", body: "We still cook in small batches, taste every pot before it leaves, and change the menu every day. That’s the whole secret." },
    ],
    quote: "If we wouldn’t serve it to our own family, it doesn’t leave the kitchen.",
    sourcing: [
      { title: "Vegetables and greens", body: "Bought every morning from markets and farms around Bengaluru. What we don’t use, we don’t serve tomorrow." },
      { title: "Grains and millets", body: "Sona masuri rice, whole-wheat atta, ragi, foxtail and little millet from suppliers we know." },
      { title: "Dairy and paneer", body: "Fresh milk and paneer every day. Curd is set in our own kitchen overnight." },
      { title: "Oils and spices", body: "Cold-pressed groundnut and coconut oil. Whole spices, roasted and ground in-house every week." },
    ],
    hygiene: [
      { title: "Caps, masks and gloves", body: "Worn by everyone on the line, every shift." },
      { title: "Temperatures logged", body: "Fridges and hot food are checked and recorded through the day." },
      { title: "Cleaned between services", body: "Surfaces, utensils and floors are deep-cleaned after every meal service." },
      { title: "Sealed for you", body: "Every box is sealed at the pass and opened only by you." },
      { title: "Licensed and inspected", body: "FSSAI licensed. Our licence number is shown at the bottom of every page." },
    ],
    team: { title: "The people who cook for you", body: "Our cooks come from home kitchens across South and North India. Each one owns a handful of recipes and cooks them every day, so your dal tastes the same on Monday as it did last Friday." },
  },
};
export const EXPERIENCE_DEFAULTS: Record<string, unknown> = {
  tagline: "Your everyday meal · a story in motion",
  scrollCue: "Scroll to begin",
  dayLabel: "A day in our kitchen",
  ingredients: "Toor dal, Curry leaves, Jeera, Ghee, Ragi, Tomato, Coconut, Byadgi chilli, Hing, Coriander, Jaggery, Mustard seeds, Tamarind, Basmati",
  ingredientsTitle: "Fourteen ingredients. One honest bowl.",
  cookerBandA: "Slow-cooked · Small batches · Slow-cooked · Small batches ·",
  cookerBandB: "Never reheated · Sealed for you · Never reheated · Sealed for you ·",
  cookerLine: "Six layers, six promises. Every part of our kitchen is there on purpose.",
  galleryEyebrow: "On the stove today",
  galleryTitle: "Made this morning.",
  galleryBody: "Keep scrolling. Every dish here was on our stove today.",
  manifesto: "We believe everyday food should taste like home. Cooked fresh, in small batches, by people who care. No shortcuts, no reheating, no packets. Just a good meal, on time, every single day.",
  routeEyebrow: "Stove to door",
  routeMinutes: "32",
  routeSteps: "Cooked the moment you order, Sealed at the pass, Rider on the way routed live, At your door still hot",
  deliveredLabel: "Delivered",
  finalTitle: "Your everyday meal.",
  finalCta: "Order tonight’s dinner",
  finalSecondaryCta: "Start a meal plan",
};
DEFAULT_SECTIONS.experience_page = EXPERIENCE_DEFAULTS;

export const HOME_ORDER = ["hero", "marquee", "cooker", "homemade", "plate", "healthy", "plans", "plans_how", "signatures", "how", "faq", "closing"];
export const DEFAULT_ORDER = HOME_ORDER;
/** CMS sections that are not on the homepage (edited in the same admin screen). */
export const OTHER_SECTIONS = ["kitchen_page", "experience_page"];

export const DEFAULT_LAYERS: CookerLayer[] = [
  { key: "vent", position: 1, name: "Steam vent", title: "Cooked to order, never reheated", body: "Your dish starts cooking when you order it. Nothing waits under a heat lamp." },
  { key: "lid", position: 2, name: "Lid", title: "Sealed at the pass", body: "Every box is closed and tamper-sealed in the kitchen, and opened only by you." },
  { key: "rice", position: 3, name: "Rice", title: "Bought fresh every morning", body: "Vegetables, paneer and grains arrive daily. What we don’t use, we don’t serve tomorrow." },
  { key: "pot", position: 4, name: "Inner pot", title: "Slow-cooked in small batches", body: "Gravies simmer for hours in small pots, so flavour builds instead of being rushed." },
  { key: "plate", position: 5, name: "Heating plate", title: "A hygiene-certified kitchen", body: "Temperature-logged, inspected and cleaned to a schedule you can ask to see." },
  { key: "base", position: 6, name: "Base", title: "Tracked from stove to door", body: "Live status and a routed ETA, so you know exactly when to set the table." },
];

export const list = (v: unknown): Item[] => (Array.isArray(v) ? (v as Item[]) : []);
export const csv = (v: unknown): string[] => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
