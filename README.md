# Cloud Kitchen

A production ordering platform for a Bengaluru cloud kitchen: menu, cart, phone OTP sign-in, delivery-zone checks, server-side pricing, UPI payments with verification, live order tracking, monthly meal plans, and an admin/CMS portal where every dish, plan and homepage section is editable. The homepage centres on a real 3D rice cooker that separates into layers as you scroll.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Realtime) · Three.js with React Three Fiber · GSAP ScrollTrigger · Lenis · Cloudinary · Vercel.

---

## Going live: step by step

Do these in order. Nothing secret ever goes in the code or in chat. Keys go only in the Supabase and Vercel dashboards.

### 1. Put the code on GitHub

Unzip, then from the project folder:

```bash
git remote add origin https://github.com/mealmooroota-ux/cloud-kitchen.git
git push -u origin main
```

(The zip already contains a git history. If you prefer, you can upload the files with GitHub's "Add file → Upload files" instead.)

### 2. Set up the database (Supabase)

In your Supabase project (`sxofpopumsobvwbazpzk`):

1. **SQL Editor → New query**: paste all of `supabase/migrations/0001_init.sql` and run it. Then do the same with `supabase/seed.sql` (starter dishes, plans and homepage text; all editable later).
2. **Authentication → Sign In / Providers → Phone**: turn it on and connect an SMS provider (Twilio, MessageBird, Vonage or Textlocal are built in). Sending SMS to Indian numbers requires DLT registration (a TRAI rule) with your SMS provider; start this early, it can take a few days. Until then, you can add **test phone numbers with fixed OTPs** on the same screen to try the full flow.
3. **Authentication → Rate limits**: keep the OTP limits on. Consider enabling CAPTCHA under Attack Protection once live.
4. **Authentication → URL Configuration**: set **Site URL** to your live address (for example `https://your-domain.com`).
5. **Make yourself admin**: Authentication → Users → **Add user** → email + password, tick "Auto confirm". Then in the SQL Editor run:
   ```sql
   update public.profiles set role = 'ADMIN' where email = 'you@example.com';
   ```
   Sign in at `/admin/login`. Kitchen and delivery staff are added later from **Admin → Customers & staff**.
6. **Project Settings → API**: you'll copy the **anon** key and the **service_role** key into Vercel in the next step. The service_role key bypasses all security rules: never share it or put it in code.

### 3. Deploy on Vercel

Import the GitHub repo in Vercel (it detects Next.js automatically). Before the first deploy, add these under **Project → Settings → Environment Variables**:

| Variable | Where to get it | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your live URL, e.g. `https://your-domain.com` | No |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://sxofpopumsobvwbazpzk.supabase.co` | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon | No |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `zu6iogvj` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role | **Yes** |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary → Settings → API Keys | **Yes** |
| `PAYMENT_PROVIDER` | `manual_upi` to start, `phonepe` once approved (see step 4) | No |
| `UPI_PAYEE_VPA` | Your UPI ID, e.g. `9742022976-2@ybl` | No |
| `UPI_PAYEE_NAME` | The name shown in the customer's UPI app | No |
| `MAPS_PROVIDER` / `MAPS_API_KEY` | See step 5 (optional) | **Yes** (key) |
| `CRON_SECRET` | Any long random string you invent | **Yes** |

Only the variables starting with `NEXT_PUBLIC_` are visible to browsers; everything else stays on the server. After adding or changing variables, redeploy (Deployments → ⋯ → Redeploy).

Then open **Admin → Settings**. The Integrations box shows which services are connected. Set your **kitchen location** (latitude/longitude), address, delivery radius, fees, GST, hours, FSSAI number and support contacts.

### 4. Payments

**How payment verification works, and what your personal QR can and can't do**

Your PhonePe QR is a personal UPI ID. UPI sends the money straight to your bank and tells no one else, so a website cannot automatically know that a customer paid. Any site claiming to "verify" a personal QR is trusting a screenshot or an "I paid" button, which is easy to fake. This site never does that.

**Option A, available today (`PAYMENT_PROVIDER=manual_upi`).** Each order shows its own QR to your UPI ID with the **exact amount and the order number pre-filled**. The order waits at "Waiting for payment" until you open your PhonePe or bank app, find the credit with that order number, and enter its **UTR / transaction ID** in **Admin → Payments**. The system rejects a UTR that was already used, checks the amount matches the order, and logs who confirmed it. Only then does the order reach the kitchen.

**Option B, recommended (`PAYMENT_PROVIDER=phonepe`): fully automatic.**
1. Apply for the **PhonePe Payment Gateway** in the PhonePe Business app or on the PhonePe Business website. This is different from your personal QR and needs business KYC documents. They will review your live site, which is why the Terms, Privacy, Refunds, Delivery and Contact pages exist. Fill in every `[BRACKET]` in `src/app/legal/[slug]/page.tsx` first.
2. Once approved, copy the Client ID, Client Secret and Client Version from the PhonePe dashboard into Vercel as `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_CLIENT_VERSION`, and set `PHONEPE_ENV=sandbox` to test first.
3. In the PhonePe dashboard, add the webhook URL `https://your-domain.com/api/payments/webhook/phonepe`. Choose a username and password there and put the same values in Vercel as `PHONEPE_WEBHOOK_USERNAME` / `PHONEPE_WEBHOOK_PASSWORD`. Subscribe to the order completed and order failed events.
4. Set `PAYMENT_PROVIDER=phonepe`, redeploy, and test with sandbox payments. When it works, switch to `PHONEPE_ENV=production` with your production keys.

With PhonePe, an order becomes "paid" only after PhonePe confirms it. The webhook signature is checked, the status is then re-confirmed with PhonePe's server, the amount is compared, and duplicate events are ignored. The order page also asks PhonePe directly while the customer waits, and a daily job re-checks any unpaid orders in case a webhook was missed.

Razorpay or Cashfree can be added later by implementing the same small interface in `src/lib/payments/`.

### 5. Delivery ETA (optional but recommended)

Arrival times use **real road routing**, never a straight-line guess. Choose one:

- **Google Maps Routes API** (most accurate in Bengaluru traffic): in Google Cloud, enable "Routes API", create an API key restricted to it, then set `MAPS_PROVIDER=google` and `MAPS_API_KEY`.
- **OpenRouteService** (free tier): sign up at openrouteservice.org, then set `MAPS_PROVIDER=ors` and `MAPS_API_KEY`.

Without either, customers see the **ready time** from cooking time, and the delivery time appears once routing is configured. The ETA is recalculated when the kitchen accepts the order and again when it goes out for delivery.

### 6. Before launch

- **Photos:** upload real photos of each dish in Admin → Products (the first photo is the cover), plus the hero and "Homemade" photos in Admin → Site content. Until then, pages show tidy named placeholders.
- **Prices:** the seeded dish and meal plan prices are **samples**. Change them in Admin → Products and Admin → Meal plans.
- **Promises:** the homepage claims ("hygiene-certified kitchen", "no preservatives", and so on) are drafts. Edit them in Admin → Site content to match only what you actually do.
- **Legal pages:** fill in the `[BRACKETS]`, and set support phone, email and FSSAI number in Admin → Settings.
- **Meal plan menu:** fill the 4-week rotation grid in Admin → Meal plans → (plan).
- **Test run:** place a real order, then confirm it through Admin → Payments → Live orders, and check the tracking page updates live.
- **Domain:** add your domain in Vercel → Domains, then update `NEXT_PUBLIC_SITE_URL` and the Supabase Site URL.

---

## How it works (for developers)

### Order lifecycle

`PAYMENT_PENDING → PAYMENT_PROCESSING → PAYMENT_PAID → CONFIRMED → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY → DELIVERED`, plus `PAYMENT_FAILED`, `CANCELLED` and `REFUNDED`.

All transitions go through the Postgres function `transition_order()`, which rejects moves not in the allowed list, enforces roles (only payment/system sources can mark an order paid; DELIVERY staff can only do delivery steps), and writes `order_status_history`. The kitchen board shows only payment-verified orders.

### Security

- **Row Level Security** on every table. Customers can read only their own orders, payments and addresses. Customers cannot write orders or payments at all; those are written server-side after validation.
- **Prices** are always recalculated on the server (`src/lib/pricing.ts`) from database prices, add-on rules, coupons, delivery fee and GST. Orders store price snapshots.
- **Payments** are never marked paid from the browser, a redirect URL, or a screenshot. See step 4.
- **Rate limits** (Postgres-backed) on checkout, payment retries and status checks. Supabase rate-limits OTPs.
- **Admin actions** re-check the role on the server. Changing someone's role is admin-only and logged.
- **Uploads** go straight from the browser to Cloudinary with a short-lived server signature; the Cloudinary secret never reaches the browser.
- **Security headers** are set in `next.config.ts`. State-changing API routes check the request origin.

### Performance and accessibility

- The 3D cooker (`src/components/three/`) loads only when the section is near the viewport, and pauses rendering when off-screen. Devices with low memory, few CPU cores, Save-Data or no WebGL2 get the pre-rendered image instead, as do users who prefer reduced motion. The 3D model is 756 KB and cached for a year.
- Lenis smooth scrolling is off on touch devices, for reduced motion, and in the admin portal.
- Fonts (Fraunces, Geist) are self-hosted, with no third-party font requests. Images are served by Cloudinary in modern formats at the right size.
- Semantic HTML, a skip link, visible focus states, labelled controls, 44 px+ tap targets, live regions for order status, and a screen-reader text version of the cooker story.

### Project layout

```
supabase/migrations/0001_init.sql   schema, RLS, state machine, realtime
supabase/seed.sql                   starter content (editable in admin)
src/app/                            pages and API routes
  api/checkout, api/quote           server-side pricing and order creation
  api/payments/webhook/phonepe      verified webhook
  api/orders/[id]/status, pay       status reconciliation, payment retry
  api/cron/reconcile                daily safety-net check (Vercel Cron)
  admin/(panel)/…                   kitchen console and CMS
src/lib/payments/                   provider interface: phonepe, manual-upi
src/lib/pricing.ts, eta/, orders.ts server logic
src/components/three/, home/        3D cooker and scroll story
public/models/rice-cooker.glb       the 3D model (six separable parts)
```

### Local development

```bash
cp .env.example .env.local   # fill in values (never commit this file)
npm install
npm run dev
```

`npm run typecheck`, `npm run lint` and `npm run build` should all pass.

### Not included yet (good next steps)

- Notifications (WhatsApp or SMS on order status changes). This needs a provider such as Gupshup or Twilio.
- A kitchen prep sheet for meal plans (tomorrow's counts per dish).
- A Razorpay or Cashfree provider (the interface is ready).
- A refund API call (refunds are currently issued in your payment dashboard, then marked in admin).
- Rider live GPS tracking. Status and ETA are live today; a moving map pin would need a rider app.
