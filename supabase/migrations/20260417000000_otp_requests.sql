-- ============================================================
-- OTP requests table — used by the send-otp / verify-otp
-- Edge Functions for ChinguiSoft SMS authentication.
--
-- Column notes:
--   otp_hash   — SHA-256 hex of the 6-digit code (never the code itself)
--   verified   — true once the correct code has been submitted
--   attempts   — incremented on every verify attempt (max 5 before lockout)
-- ============================================================

create table if not exists public.otp_requests (
  id          uuid        primary key default gen_random_uuid(),
  phone       text        not null,
  otp_hash    text        not null,
  expires_at  timestamptz not null,
  attempts    integer     not null default 0,
  verified    boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- Lookup index: find latest valid OTP for a phone quickly
create index if not exists idx_otp_requests_phone
  on public.otp_requests (phone, expires_at);

-- RLS: enabled but no user-facing policies.
-- The Edge Functions use the service-role key which bypasses RLS.
-- Direct browser access is intentionally blocked.
alter table public.otp_requests enable row level security;

-- Auto-purge: remove rows older than 1 hour to keep the table small.
-- Requires pg_cron extension to be enabled in Supabase (Dashboard → Database → Extensions).
-- If pg_cron is not available, old rows are harmless (they are expired and verified=true).
-- Uncomment the block below after enabling pg_cron:
--
-- select cron.schedule(
--   'purge-otp-requests',
--   '0 * * * *',
--   $$
--     delete from public.otp_requests
--     where created_at < now() - interval '1 hour';
--   $$
-- );
