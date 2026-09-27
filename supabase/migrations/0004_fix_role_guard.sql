-- MOOROOTA 0004: let the database owner (SQL editor) and the server change roles; keep blocking website visitors.
create or replace function public.guard_profile_role() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  -- Only website visitors (anon/authenticated) are blocked. The server (service_role) and you in the SQL editor are allowed.
  if current_user in ('anon', 'authenticated') then
    if new.role is distinct from old.role then raise exception 'ROLE_CHANGE_FORBIDDEN'; end if;
    if new.phone is distinct from old.phone then raise exception 'PHONE_CHANGE_FORBIDDEN'; end if;
  end if;
  return new;
end $$;
