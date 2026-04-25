-- Migration to rename otp_hash column to code_hash safely

DO $$ 
BEGIN
  -- Check if 'otp_requests' table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'otp_requests') THEN

    -- Check if 'otp_hash' column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'otp_requests' 
        AND column_name = 'otp_hash'
    ) THEN

      -- Check if 'code_hash' DOES NOT exist yet
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'otp_requests' 
          AND column_name = 'code_hash'
      ) THEN
        -- Rename column
        ALTER TABLE public.otp_requests RENAME COLUMN otp_hash TO code_hash;
      END IF;

    ELSE
      -- If 'otp_hash' does not exist, check if 'code_hash' is also missing
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'otp_requests' 
          AND column_name = 'code_hash'
      ) THEN
        -- Adding the column directly
        ALTER TABLE public.otp_requests ADD COLUMN code_hash text not null;
      END IF;
    END IF;
    
    -- Ensure indexes are present
    CREATE INDEX IF NOT EXISTS idx_otp_requests_phone_expires ON public.otp_requests (phone, expires_at);
    CREATE INDEX IF NOT EXISTS idx_otp_requests_created_at ON public.otp_requests (created_at);

  ELSE
    -- Recreate the full table if missing
    CREATE TABLE public.otp_requests (
      id          uuid        primary key default gen_random_uuid(),
      phone       text        not null,
      code_hash   text        not null,
      expires_at  timestamptz not null,
      attempts    integer     not null default 0,
      verified    boolean     not null default false,
      created_at  timestamptz not null default now()
    );

    CREATE INDEX idx_otp_requests_phone_expires ON public.otp_requests (phone, expires_at);
    CREATE INDEX idx_otp_requests_created_at ON public.otp_requests (created_at);
    ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
