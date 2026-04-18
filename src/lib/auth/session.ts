import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Profile } from '@/types'

export const SESSION_COOKIE = 'bac_session'
export const SESSION_DAYS   = 7

async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value)
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashToken(token: string): Promise<string> {
  return sha256Hex(token)
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Reads the session cookie, validates against auth_sessions, returns the profile.
 * Returns null if no session or if the session is expired/revoked.
 */
export async function getSessionProfile(): Promise<Profile | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const hash = await hashToken(token)
  const db   = serviceClient()

  const { data: session } = await db
    .from('auth_sessions')
    .select('user_id, expires_at')
    .eq('token_hash', hash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session?.user_id) {
    // Cookie exists but session is not in the DB or is expired.
    // Clear it so middleware stops treating this request as authenticated.
    cookieStore.delete(SESSION_COOKIE)
    return null
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', session.user_id)
    .single()

  if (!profile) {
    cookieStore.delete(SESSION_COOKIE)
    return null
  }

  return profile as Profile
}

/**
 * Deletes the session from the DB and clears the cookie.
 * Safe to call even if no session is present.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    const hash = await hashToken(token)
    await serviceClient().from('auth_sessions').delete().eq('token_hash', hash)
  }
  cookieStore.delete(SESSION_COOKIE)
}
