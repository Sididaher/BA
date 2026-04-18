import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using the service role key.
 * RLS is bypassed — all callers MUST enforce authorization manually
 * via requireAuth() / requireAdmin() before querying user data.
 */
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
