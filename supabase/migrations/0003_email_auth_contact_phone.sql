-- MOOROOTA 0003: email/Google sign-in + delivery phone collected at checkout. Safe to run more than once.

-- Contact number for this delivery (collected at checkout). Customers' latest number is also kept on their profile.
alter table public.orders add column if not exists contact_phone text;

-- New users: keep the name they typed (email sign-up) or their Google profile name.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, email, full_name)
  values (new.id, new.phone, new.email, nullif(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), ''))
  on conflict (id) do update set email = coalesce(public.profiles.email, excluded.email), full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end $$;
