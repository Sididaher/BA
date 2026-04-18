-- RPC used by finalize-registration Edge Function to look up an auth.users row
-- by phone number without needing admin.listUsers (which is unreliable).
-- security definer runs as the function owner (postgres) so it can read auth schema.
create or replace function public.get_user_id_by_phone(p_phone text)
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select id from auth.users where phone = p_phone limit 1;
$$;

-- Only service-role callers should ever need this; revoke public execute.
revoke execute on function public.get_user_id_by_phone(text) from public, anon, authenticated;
grant  execute on function public.get_user_id_by_phone(text) to service_role;
