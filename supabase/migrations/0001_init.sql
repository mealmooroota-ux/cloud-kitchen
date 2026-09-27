-- Cloud Kitchen: core schema, RLS, order state machine, CMS
-- Run in Supabase SQL editor (or `supabase db push`). Idempotent-ish on a fresh project.

create extension if not exists pgcrypto;

-- ---------- enums ----------
do $$ begin
  create type app_role as enum ('CUSTOMER','ADMIN','KITCHEN','DELIVERY');
exception when duplicate_object then null; end $$;
do $$ begin
  create type order_status as enum ('PAYMENT_PENDING','PAYMENT_PROCESSING','PAYMENT_PAID','CONFIRMED','PREPARING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED','PAYMENT_FAILED','CANCELLED','REFUNDED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type payment_status as enum ('CREATED','PENDING','PAID','FAILED','NEEDS_REVIEW','REFUNDED','EXPIRED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type order_kind as enum ('ORDER','PLAN');
exception when duplicate_object then null; end $$;
do $$ begin
  create type subscription_status as enum ('PENDING_PAYMENT','ACTIVE','PAUSED','CANCELLED','COMPLETED');
exception when duplicate_object then null; end $$;

-- ---------- helpers ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- users / profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role app_role not null default 'CUSTOMER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, email) values (new.id, new.phone, new.email)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.current_role_name() returns app_role language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'CUSTOMER'::app_role)
$$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() in ('ADMIN','KITCHEN','DELIVERY')
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() = 'ADMIN'
$$;

-- ---------- addresses ----------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  line1 text not null,
  line2 text,
  landmark text,
  city text not null default 'Bengaluru',
  postal_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses(user_id);
create trigger addresses_touch before update on public.addresses for each row execute function public.touch_updated_at();

-- ---------- settings (single row) ----------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  kitchen_name text not null default 'Cloud Kitchen',
  kitchen_address text,
  kitchen_lat double precision not null default 12.9716,
  kitchen_lng double precision not null default 77.5946,
  delivery_radius_km numeric not null default 7,
  delivery_fee_paise int not null default 4000,
  free_delivery_above_paise int,
  tax_rate_bps int not null default 500,          -- 5% GST
  packing_minutes int not null default 5,
  buffer_minutes int not null default 5,
  min_order_paise int not null default 0,
  is_open boolean not null default true,
  open_time time not null default '11:00',
  close_time time not null default '23:00',
  auto_confirm_paid_orders boolean not null default false,
  support_phone text,
  support_email text,
  fssai_license text,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict do nothing;
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();

-- ---------- menu ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price_paise int not null check (price_paise >= 0),
  is_veg boolean not null default true,
  prep_minutes int not null default 20 check (prep_minutes between 1 and 240),
  serves text,
  calories int,
  protein_g numeric,
  tags text[] not null default '{}',
  is_available boolean not null default true,
  is_active boolean not null default true,
  show_on_home boolean not null default false,
  in_plan_rotation boolean not null default false,
  daily_limit int,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id, position);
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  public_id text not null,           -- Cloudinary public_id
  kind text not null default 'image' check (kind in ('image','video')),
  alt text,
  position int not null default 0
);
create index if not exists product_media_idx on public.product_media(product_id, position);

create table if not exists public.addon_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  min_select int not null default 0,
  max_select int not null default 1,
  position int not null default 0
);
create table if not exists public.addons (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.addon_groups(id) on delete cascade,
  name text not null,
  price_paise int not null default 0 check (price_paise >= 0),
  is_available boolean not null default true,
  position int not null default 0
);
create index if not exists addons_group_idx on public.addons(group_id);

create table if not exists public.coupons (
  code text primary key,
  kind text not null check (kind in ('PERCENT','FLAT')),
  value int not null check (value > 0),         -- percent (1-100) or paise
  min_subtotal_paise int not null default 0,
  max_discount_paise int,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  is_active boolean not null default true
);

-- ---------- meal plans ----------
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  label text not null,
  description text not null default '',
  meals text[] not null default '{LUNCH,DINNER}',
  features text[] not null default '{}',
  veg_option boolean not null default true,
  nonveg_option boolean not null default false,
  delivery_slots jsonb not null default '{"BREAKFAST":"7:30 – 8:30 AM","LUNCH":"12:30 – 1:30 PM","DINNER":"8:00 – 9:00 PM"}',
  skip_cutoff_hours int not null default 3,     -- hours before 00:00 of the day (9 PM previous day)
  allow_pause boolean not null default true,
  highlight boolean not null default false,
  show_on_home boolean not null default true,
  is_active boolean not null default true,
  position int not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.meal_plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.meal_plans(id) on delete cascade,
  duration_days int not null check (duration_days > 0),
  label text not null,
  veg_price_paise int not null check (veg_price_paise >= 100),
  nonveg_price_paise int,
  is_visible boolean not null default true,
  unique(plan_id, duration_days)
);
create table if not exists public.plan_menu (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.meal_plans(id) on delete cascade,
  week int not null check (week between 1 and 4),
  weekday int not null check (weekday between 0 and 6),   -- 0 = Monday
  meal text not null check (meal in ('BREAKFAST','LUNCH','DINNER','SNACK')),
  product_id uuid references public.products(id) on delete set null,
  custom_name text,
  unique(plan_id, week, weekday, meal)
);

-- ---------- orders ----------
create sequence if not exists public.order_number_seq start 20000;
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('CK-' || nextval('public.order_number_seq')),
  user_id uuid not null references auth.users(id),
  kind order_kind not null default 'ORDER',
  status order_status not null default 'PAYMENT_PENDING',
  payment_status payment_status not null default 'CREATED',
  subtotal_paise int not null,
  delivery_fee_paise int not null default 0,
  discount_paise int not null default 0,
  tax_paise int not null default 0,
  total_paise int not null check (total_paise >= 0),
  currency text not null default 'INR',
  coupon_code text,
  address_id uuid references public.addresses(id) on delete set null,
  delivery_address jsonb,
  latitude double precision,
  longitude double precision,
  distance_m int,
  travel_seconds int,
  prep_minutes int,
  eta_is_estimate boolean not null default true,
  estimated_ready_at timestamptz,
  estimated_delivery_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_idx on public.orders(status, created_at);
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,         -- snapshot
  is_veg boolean,
  unit_price_paise int not null,      -- snapshot
  quantity int not null check (quantity between 1 and 50),
  addons jsonb not null default '[]', -- snapshot [{name, price_paise}]
  line_total_paise int not null,
  meta jsonb
);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid,
  source text not null,               -- 'system' | 'payment' | 'staff'
  note text,
  created_at timestamptz not null default now()
);
create index if not exists osh_order_idx on public.order_status_history(order_id, created_at);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_order_id text not null,
  provider_payment_id text,
  transaction_reference text,
  amount_paise int not null,
  currency text not null default 'INR',
  status payment_status not null default 'CREATED',
  redirect_url text,
  qr_payload text,
  expires_at timestamptz,
  paid_at timestamptz,
  verified_by uuid,                   -- staff who verified (manual UPI only)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_order_id)
);
create index if not exists payments_order_idx on public.payments(order_id);
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated_at();

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null,
  event_type text not null,
  provider_order_id text,
  dedupe_key text unique,
  signature_valid boolean not null,
  processed boolean not null default false,
  error text,
  payload jsonb,
  received_at timestamptz not null default now()
);

create table if not exists public.delivery (
  order_id uuid primary key references public.orders(id) on delete cascade,
  rider_name text,
  rider_phone text,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz
);

-- ---------- subscriptions ----------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  plan_id uuid not null references public.meal_plans(id),
  price_id uuid references public.meal_plan_prices(id),
  order_id uuid references public.orders(id),
  diet text not null default 'VEG' check (diet in ('VEG','NONVEG')),
  preferences text[] not null default '{}',
  meals text[] not null,
  slots jsonb,
  address_id uuid references public.addresses(id) on delete set null,
  delivery_address jsonb,
  start_date date not null,
  end_date date not null,
  status subscription_status not null default 'PENDING_PAYMENT',
  paused_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subs_user_idx on public.subscriptions(user_id);
create trigger subs_touch before update on public.subscriptions for each row execute function public.touch_updated_at();
create table if not exists public.subscription_skips (
  id bigint generated always as identity primary key,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  date date not null,
  meal text not null,
  created_at timestamptz not null default now(),
  unique(subscription_id, date, meal)
);

-- ---------- CMS ----------
create table if not exists public.site_sections (
  key text primary key,
  position int not null default 0,
  is_enabled boolean not null default true,
  content jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create table if not exists public.cooker_layers (
  key text primary key check (key in ('vent','lid','rice','pot','plate','base')),
  position int not null,
  name text not null,
  title text not null,
  body text not null
);

-- ---------- rate limiting ----------
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);
create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from public.rate_limits where key = p_key for update;
  if not found or r.window_start < now() - make_interval(secs => p_window_seconds) then
    insert into public.rate_limits(key, window_start, count) values (p_key, now(), 1)
    on conflict (key) do update set window_start = now(), count = 1;
    return true;
  end if;
  if r.count >= p_max then return false; end if;
  update public.rate_limits set count = count + 1 where key = p_key;
  return true;
end $$;
revoke all on function public.check_rate_limit(text,int,int) from public, anon, authenticated;

-- ---------- order state machine ----------
create or replace function public.order_transition_allowed(p_from order_status, p_to order_status) returns boolean language sql immutable as $$
  select (p_from, p_to) in (
    ('PAYMENT_PENDING','PAYMENT_PROCESSING'), ('PAYMENT_PENDING','PAYMENT_PAID'), ('PAYMENT_PENDING','PAYMENT_FAILED'), ('PAYMENT_PENDING','CANCELLED'),
    ('PAYMENT_PROCESSING','PAYMENT_PAID'), ('PAYMENT_PROCESSING','PAYMENT_FAILED'),
    ('PAYMENT_FAILED','PAYMENT_PENDING'), ('PAYMENT_FAILED','CANCELLED'),
    ('PAYMENT_PAID','CONFIRMED'), ('PAYMENT_PAID','CANCELLED'),
    ('CONFIRMED','PREPARING'), ('CONFIRMED','CANCELLED'),
    ('PREPARING','READY_FOR_PICKUP'), ('PREPARING','CANCELLED'),
    ('READY_FOR_PICKUP','OUT_FOR_DELIVERY'),
    ('OUT_FOR_DELIVERY','DELIVERED'),
    ('CANCELLED','REFUNDED'), ('PAYMENT_PAID','REFUNDED')
  )
$$;

-- p_source: 'payment' and 'system' are only accepted from the service role (server).
create or replace function public.transition_order(p_order_id uuid, p_to order_status, p_source text, p_note text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare o public.orders; v_from order_status; is_service boolean := (auth.role() = 'service_role'); r app_role := public.current_role_name();
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status = p_to then return o; end if;                              -- idempotent
  v_from := o.status;
  if not public.order_transition_allowed(o.status, p_to) then
    raise exception 'INVALID_TRANSITION % -> %', o.status, p_to;
  end if;
  if p_source in ('payment','system') and not is_service then raise exception 'FORBIDDEN'; end if;
  if p_to in ('PAYMENT_PROCESSING','PAYMENT_PAID','PAYMENT_FAILED','PAYMENT_PENDING') and not is_service then
    raise exception 'PAYMENT_STATES_ARE_SERVER_ONLY';
  end if;
  if not is_service then
    if r = 'CUSTOMER' then raise exception 'FORBIDDEN'; end if;
    if r = 'DELIVERY' and p_to not in ('OUT_FOR_DELIVERY','DELIVERED') then raise exception 'FORBIDDEN'; end if;
    if r = 'KITCHEN' and p_to in ('REFUNDED') then raise exception 'FORBIDDEN'; end if;
  end if;
  update public.orders set status = p_to,
    payment_status = case when p_to = 'PAYMENT_PAID' then 'PAID'::payment_status
                          when p_to = 'PAYMENT_FAILED' then 'FAILED'::payment_status
                          when p_to = 'PAYMENT_PROCESSING' then 'PENDING'::payment_status
                          when p_to = 'REFUNDED' then 'REFUNDED'::payment_status
                          else payment_status end
  where id = p_order_id returning * into o;
  insert into public.order_status_history(order_id, from_status, to_status, changed_by, source, note)
  values (p_order_id, v_from, p_to, auth.uid(), p_source, p_note);
  -- activate meal plan subscriptions on payment
  if p_to = 'PAYMENT_PAID' and o.kind = 'PLAN' then
    update public.subscriptions set status = 'ACTIVE' where order_id = o.id and status = 'PENDING_PAYMENT';
  end if;
  return o;
end $$;
revoke all on function public.transition_order(uuid, order_status, text, text) from public, anon;
grant execute on function public.transition_order(uuid, order_status, text, text) to authenticated, service_role;

-- initial history row when an order is created
create or replace function public.order_created_history() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.order_status_history(order_id, from_status, to_status, source) values (new.id, null, new.status, 'system');
  return new;
end $$;
drop trigger if exists orders_created_history on public.orders;
create trigger orders_created_history after insert on public.orders for each row execute function public.order_created_history();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;
alter table public.addon_groups enable row level security;
alter table public.addons enable row level security;
alter table public.coupons enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_prices enable row level security;
alter table public.plan_menu enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.delivery enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_skips enable row level security;
alter table public.site_sections enable row level security;
alter table public.cooker_layers enable row level security;
alter table public.rate_limits enable row level security;

-- profiles: own row; role column cannot be changed by users
create policy profiles_self_select on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());
revoke update (role) on public.profiles from authenticated;

-- addresses: owner CRUD, staff read
create policy addr_owner on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addr_staff_read on public.addresses for select using (public.is_staff());

-- public catalogue + CMS: anyone reads active rows, admin writes
create policy settings_read on public.settings for select using (true);
create policy settings_admin on public.settings for update using (public.is_admin()) with check (public.is_admin());
create policy cat_read on public.categories for select using (is_active or public.is_staff());
create policy cat_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy prod_read on public.products for select using (is_active or public.is_staff());
create policy prod_admin on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy prod_kitchen_avail on public.products for update using (public.current_role_name() = 'KITCHEN') with check (public.current_role_name() = 'KITCHEN');
create policy media_read on public.product_media for select using (true);
create policy media_admin on public.product_media for all using (public.is_admin()) with check (public.is_admin());
create policy ag_read on public.addon_groups for select using (true);
create policy ag_admin on public.addon_groups for all using (public.is_admin()) with check (public.is_admin());
create policy addon_read on public.addons for select using (true);
create policy addon_admin on public.addons for all using (public.is_admin()) with check (public.is_admin());
create policy coupons_admin on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy plans_read on public.meal_plans for select using (is_active or public.is_staff());
create policy plans_admin on public.meal_plans for all using (public.is_admin()) with check (public.is_admin());
create policy plan_prices_read on public.meal_plan_prices for select using (true);
create policy plan_prices_admin on public.meal_plan_prices for all using (public.is_admin()) with check (public.is_admin());
create policy plan_menu_read on public.plan_menu for select using (true);
create policy plan_menu_admin on public.plan_menu for all using (public.is_admin()) with check (public.is_admin());
create policy sections_read on public.site_sections for select using (true);
create policy sections_admin on public.site_sections for all using (public.is_admin()) with check (public.is_admin());
create policy layers_read on public.cooker_layers for select using (true);
create policy layers_admin on public.cooker_layers for all using (public.is_admin()) with check (public.is_admin());

-- orders & payments: customers READ their own; all writes happen on the server (service role) or via transition_order()
create policy orders_owner_read on public.orders for select using (user_id = auth.uid());
create policy orders_staff_read on public.orders for select using (public.is_staff());
create policy items_owner_read on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy items_staff_read on public.order_items for select using (public.is_staff());
create policy hist_owner_read on public.order_status_history for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy hist_staff_read on public.order_status_history for select using (public.is_staff());
create policy pay_owner_read on public.payments for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy pay_staff_read on public.payments for select using (public.is_staff());
create policy pev_admin_read on public.payment_events for select using (public.is_admin());
create policy delivery_owner_read on public.delivery for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy delivery_staff on public.delivery for all using (public.is_staff()) with check (public.is_staff());
create policy subs_owner_read on public.subscriptions for select using (user_id = auth.uid());
create policy subs_staff_read on public.subscriptions for select using (public.is_staff());
create policy skips_owner_read on public.subscription_skips for select using (exists (select 1 from public.subscriptions s where s.id = subscription_id and s.user_id = auth.uid()));
create policy skips_staff_read on public.subscription_skips for select using (public.is_staff());
-- rate_limits: no policies (service role only)

-- ---------- realtime ----------
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when others then null; end $$;

-- coupon usage counter (server only)
create or replace function public.increment_coupon(p_code text) returns void language sql security definer set search_path = public as $$
  update public.coupons set used_count = used_count + 1 where code = p_code
$$;
revoke all on function public.increment_coupon(text) from public, anon, authenticated;
