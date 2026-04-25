-- ============================================================
-- FINAL OTP_REQUESTS SCHEMA — NUCLEAR RESET
-- This ensures the DB schema is EXACTLY aligned with the code.
-- ============================================================

-- Safely drop old or inconsistent table to avoid schema cache issues
DROP TABLE IF EXISTS public.otp_requests CASCADE;

-- Recreate table with the requested final schema
CREATE TABLE public.otp_requests (
  id          uuid        primary key default gen_random_uuid(),
  phone       text        not null,
  code_hash   text        not null,
  expires_at  timestamptz not null,
  attempts    integer     not null default 0,
  verified    boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- Essential indexes for performance
CREATE INDEX idx_otp_requests_phone_expires ON public.otp_requests (phone, expires_at);
CREATE INDEX idx_otp_requests_created_at ON public.otp_requests (created_at);

-- RLS: Service role only access (used by Edge Functions)
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;
-- No policies needed as Edge Functions use the service role key which bypasses RLS.
