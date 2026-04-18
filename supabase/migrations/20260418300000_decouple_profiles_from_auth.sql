-- ============================================================
-- Decouple profiles from auth.users
--
-- The app uses fully custom auth (profiles + password_hash +
-- auth_sessions). Supabase Authentication → Users is intentionally
-- empty. profiles.id no longer needs to reference auth.users(id).
-- ============================================================

-- 1. Drop the FK that requires an auth.users row to exist first.
--    Postgres default constraint name is profiles_id_fkey.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name        = 'profiles'
      AND constraint_name   = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- 2. Give profiles.id a standalone default so Edge Functions can
--    insert a new profile with gen_random_uuid() without auth.users.
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Drop the trigger that auto-creates a profile on auth.users insert.
--    It will never fire because we no longer create auth.users rows.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Drop the now-unused RPC that looked up auth.users by phone.
DROP FUNCTION IF EXISTS public.get_user_id_by_phone(text);

-- 5. Force PostgREST schema cache reload.
NOTIFY pgrst, 'reload schema';
