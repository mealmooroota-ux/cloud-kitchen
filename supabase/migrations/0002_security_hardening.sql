-- MOOROOTA 0002: security hardening. Run after 0001_init.sql (safe to run more than once).

-- 1) Customers may only edit their own name. Roles can never be changed from the browser.
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;

create or replace function public.guard_profile_role() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'ROLE_CHANGE_FORBIDDEN';
  end if;
  if new.phone is distinct from old.phone and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'PHONE_CHANGE_FORBIDDEN';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role before update on public.profiles for each row execute function public.guard_profile_role();

-- 2) Catalogue, content and settings are written only by the server (after it checks the admin role).
drop policy if exists prod_kitchen_avail on public.products;
do $$ declare t text; begin
  foreach t in array array['categories','products','product_media','addon_groups','addons','coupons','meal_plans','meal_plan_prices','plan_menu','site_sections','cooker_layers','settings'] loop
    execute format('revoke insert, update, delete on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- 3) Orders, payments and their history are server-only for writes. Customers read their own rows via RLS.
do $$ declare t text; begin
  foreach t in array array['orders','order_items','order_status_history','payments','payment_events','delivery','subscriptions','subscription_skips','rate_limits'] loop
    execute format('revoke insert, update, delete on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke select on public.payment_events, public.rate_limits from anon, authenticated;
grant select on public.payment_events to authenticated; -- still filtered by RLS (admins only)

-- 4) Anonymous visitors: read the public menu and site content, nothing else.
revoke all on public.addresses, public.orders, public.order_items, public.payments, public.subscriptions, public.subscription_skips, public.delivery, public.order_status_history, public.profiles from anon;

-- 5) Staff move orders only through transition_order() (which enforces the state machine and roles).
grant execute on function public.transition_order(uuid, order_status, text, text) to authenticated;
