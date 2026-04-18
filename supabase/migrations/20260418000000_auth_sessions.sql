-- ============================================================
-- Custom session store — replaces supabase.auth.admin.createSession()
-- which does not exist in gotrue-js.
-- user_id FK → profiles.id (same value as auth.users.id due to trigger).
-- Service role only — no RLS policies intentionally.
-- ============================================================

create table if not exists public.auth_sessions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  token_hash text        not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_sessions_token_hash on public.auth_sessions (token_hash);
create index if not exists idx_auth_sessions_user_id    on public.auth_sessions (user_id);
create index if not exists idx_auth_sessions_expires_at on public.auth_sessions (expires_at);

alter table public.auth_sessions enable row level security;
-- No policies: access only via service role key from Edge Functions and server-side code.

-- PostgREST schema cache reload
notify pgrst, 'reload schema';
