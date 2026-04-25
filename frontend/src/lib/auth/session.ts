import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Profile } from '@/types'

export const SESSION_COOKIE = 'bac_session'
export const SESSION_DAYS   = 7

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

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

/**
 * Validates a session token against the database using a secure RPC.
 */
export async function validateSession(token: string): Promise<Profile | null> {
  const hash = await hashToken(token)
  const db   = serviceClient()

  console.log('[AUTH] Validating session via RPC...')

  const { data: profile, error } = await db.rpc('auth_validate_session', {
    p_token_hash: hash
  })

  if (error || !profile) {
    if (error) console.error('[AUTH] RPC Error:', error.message)
    return null
  }

  return profile as Profile
}

/**
 * Reads the session cookie and returns the profile.
 */
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  return validateSession(token)
})

/**
 * Clears the session cookie and invalidates the session in DB.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  
  if (token) {
    const hash = await hashToken(token)
    const db   = serviceClient()
    await db.rpc('auth_invalidate_session', { p_token_hash: hash })
  }

  cookieStore.delete(SESSION_COOKIE)
}
