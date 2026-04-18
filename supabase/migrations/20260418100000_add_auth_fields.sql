-- ============================================================
-- Add password_hash to profiles + create phone_verifications
-- phone_verifications: short-lived proof that a phone was OTP-verified
-- during registration, consumed once by finalize-registration.
-- ============================================================

alter table public.profiles
  add column if not exists password_hash text;

create table if not exists public.phone_verifications (
  id         uuid        primary key default gen_random_uuid(),
  phone      text        not null,
  token_hash text        not null unique,
  expires_at timestamptz not null,
  used       boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_phone_verifications_token_hash
  on public.phone_verifications (token_hash);

create index if not exists idx_phone_verifications_phone
  on public.phone_verifications (phone, expires_at);

alter table public.phone_verifications enable row level security;
-- No policies — service role only, no direct client access.

notify pgrst, 'reload schema';
