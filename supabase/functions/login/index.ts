import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyPassword } from '../_shared/password.ts'

/**
 * login: Authenticates an existing user with phone + password.
 * No OTP required — OTP is only used during first-time registration.
 *
 * Steps:
 *  1. Validate phone format
 *  2. Look up profile by phone
 *  3. Ensure account is complete (password_hash set) and active
 *  4. Verify password (PBKDF2-SHA256, constant-time)
 *  5. Create auth_session
 *  6. Return session_token
 */

const SESSION_DAYS      = 7
const MAURITANIAN_PHONE = /^\+222[234678]\d{7}$/

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function log(step: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ fn: 'login', step, ts: new Date().toISOString(), ...data }))
}
function logError(step: string, err: unknown, extra?: Record<string, unknown>) {
  console.error(JSON.stringify({
    fn: 'login', step, ts: new Date().toISOString(),
    error: err instanceof Error ? err.message : String(err), ...extra,
  }))
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
function errorResponse(error: string, status: number, details?: string): Response {
  return jsonResponse({ success: false, error, ...(details ? { details } : {}) }, status)
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS })
  log('request_received')
  try { return await handleRequest(req) }
  catch (err) {
    logError('unhandled_exception', err)
    return errorResponse('internal_error', 500, err instanceof Error ? err.message : String(err))
  }
})

async function handleRequest(req: Request): Promise<Response> {

  // ── 1. Env ─────────────────────────────────────────────────────────────────
  const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logError('missing_env', 'Supabase secrets not set')
    return errorResponse('missing_env_vars', 500)
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let phone: string
  let password: string
  try {
    const body = await req.json()
    phone    = (body?.phone    ?? '').trim()
    password = (body?.password ?? '')
  } catch (err) {
    logError('parse_body', err)
    return errorResponse('invalid_request_body', 400)
  }

  log('input_parsed', { phone_prefix: phone.slice(0, 6), has_password: password.length > 0 })

  // ── 3. Validate inputs ─────────────────────────────────────────────────────
  if (!MAURITANIAN_PHONE.test(phone)) return errorResponse('invalid_phone', 400)
  if (!password)                      return errorResponse('missing_password', 400)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 4. Look up profile by phone ────────────────────────────────────────────
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, password_hash, is_active')
    .eq('phone', phone)
    .maybeSingle()

  if (profileErr) {
    logError('profile_fetch_error', profileErr)
    return errorResponse('db_error', 500)
  }

  log('profile_fetch', {
    found:        !!profile,
    has_password: !!profile?.password_hash,
    is_active:    profile?.is_active ?? null,
  })

  if (!profile) {
    log('branch_profile_not_found', { phone_prefix: phone.slice(0, 6) })
    return errorResponse('invalid_credentials', 401, 'Numéro ou mot de passe incorrect.')
  }

  if (!profile.password_hash) {
    log('branch_missing_password_hash', { user_id: profile.id })
    return errorResponse('invalid_credentials', 401, 'Numéro ou mot de passe incorrect.')
  }

  if (!profile.is_active) {
    log('branch_inactive_account', { user_id: profile.id })
    return errorResponse('account_inactive', 403, 'Ce compte a été désactivé. Contacte le support.')
  }

  // ── 5. Verify password ─────────────────────────────────────────────────────
  const passwordValid = await verifyPassword(password, profile.password_hash)
  log('password_check', { valid: passwordValid, user_id: profile.id })

  if (!passwordValid) {
    log('branch_invalid_password', { user_id: profile.id })
    return errorResponse('invalid_credentials', 401, 'Numéro ou mot de passe incorrect.')
  }

  // ── 6. Create session ──────────────────────────────────────────────────────
  const sessionToken = generateSessionToken()
  const sessionHash  = await sha256Hex(sessionToken)
  const expiresAt    = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error: sessionErr } = await supabase.from('auth_sessions').insert({
    user_id:    profile.id,
    token_hash: sessionHash,
    expires_at: expiresAt,
  })

  if (sessionErr) {
    logError('session_insert_failed', sessionErr, { code: sessionErr.code })
    return errorResponse('session_creation_failed', 500)
  }

  log('success', { user_id: profile.id })

  return jsonResponse({ success: true, session_token: sessionToken })
}
