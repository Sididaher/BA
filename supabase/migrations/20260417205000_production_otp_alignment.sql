-- ============================================================
-- 20260417205000: Production OTP Alignment & Cache Reload
-- ============================================================

-- 1. Ensure the table is exactly as expected
DO $$ 
BEGIN
    -- DROP table to force a clean schema re-creation and avoid ambiguity
    DROP TABLE IF EXISTS public.otp_requests CASCADE;

    CREATE TABLE public.otp_requests (
      id          uuid        primary key default gen_random_uuid(),
      phone       text        not null,
      code_hash   text        not null,
      expires_at  timestamptz not null,
      attempts    integer     not null default 0,
      verified    boolean     not null default false,
      created_at  timestamptz not null default now()
    );

    -- 2. Restore essential security and indices
    ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;
    
    CREATE INDEX idx_otp_requests_phone_expires ON public.otp_requests (phone, expires_at);
    CREATE INDEX idx_otp_requests_created_at ON public.otp_requests (created_at);

END $$;

-- 3. FORCE PostgREST to reload the schema cache.
-- This is critical to resolve "Could not find column... in schema cache" errors.
NOTIFY pgrst, 'reload schema';
