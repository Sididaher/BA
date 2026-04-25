import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hashPassword } from '../_shared/password.ts'

/**
 * finalize-registration
 *
 * Fully custom auth — does NOT touch auth.users or any Supabase Auth API.
 * profiles.id is a standalone UUID; auth_sessions.user_id → profiles.id.
 *
 * Three cases based on profiles table only:
 *
 *  Case A — no profile with this phone → generate UUID, insert profile
 *  Case B — profile exists WITH password_hash → reject (already registered)
 *  Case C — profile exists WITHOUT password_hash → incomplete, resume it
 */

const SESSION_DAYS     = 7
const MIN_PASSWORD_LEN = 8

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function log(step: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ fn: 'finalize-registration', step, ts: new Date().toISOString(), ...data }))
}
function logError(step: string, err: unknown, extra?: Record<string, unknown>) {
  console.error(JSON.stringify({
    fn: 'finalize-registration', step, ts: new Date().toISOString(),
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

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

const MAURITANIAN_PHONE = /^\+222[234678]\d{7}$/

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
  const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logError('missing_env', 'Supabase secrets not set')
    return errorResponse('missing_env_vars', 500)
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let phoneVerifiedToken: string
  let password: string
  let name: string
  try {
    const body         = await req.json()
    phoneVerifiedToken = (body?.phone_verified_token ?? '').trim()
    password           = (body?.password ?? '')
    name               = (body?.name ?? '').trim()
  } catch (err) {
    logError('parse_body', err)
    return errorResponse('invalid_request_body', 400)
  }

  log('input_parsed', {
    has_token:    phoneVerifiedToken.length > 0,
    has_password: password.length > 0,
    has_name:     name.length > 0,
  })

  // ── 3. Validate inputs ─────────────────────────────────────────────────────
  if (!phoneVerifiedToken)            return errorResponse('missing_verification_token', 400)
  if (!name)                          return errorResponse('missing_name', 400)
  if (password.length < MIN_PASSWORD_LEN) {
    return errorResponse('weak_password', 400,
      `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 4. Validate phone_verified_token ───────────────────────────────────────
  const tokenHash = await sha256Hex(phoneVerifiedToken)

  const { data: verification, error: verifyFetchErr } = await supabase
    .from('phone_verifications')
    .select('id, phone, expires_at, used')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (verifyFetchErr) {
    logError('verification_fetch_error', verifyFetchErr)
    return errorResponse('db_error', 500)
  }

  log('verification_fetch', {
    found:      !!verification,
    used:       verification?.used ?? null,
    expires_at: verification?.expires_at ?? null,
  })

  if (!verification)                                   return errorResponse('verification_token_invalid', 400)
  if (verification.used)                               return errorResponse('verification_token_used', 400)
  if (new Date() > new Date(verification.expires_at))  return errorResponse('verification_token_expired', 400)

  const phone = verification.phone
  if (!MAURITANIAN_PHONE.test(phone)) {
    logError('invalid_phone_in_token', `Phone in token: ${phone.slice(0, 6)}`)
    return errorResponse('invalid_phone', 400)
  }

  // ── 5. Hash password ───────────────────────────────────────────────────────
  const passwordHash = await hashPassword(password)
  log('password_hashed')

  // ── 6. Resolve user — profiles only, no auth.users ────────────────────────
  log('profile_lookup', { phone_prefix: phone.slice(0, 6) })

  const { data: existingProfile, error: profileFetchErr } = await supabase
    .from('profiles')
    .select('id, password_hash')
    .eq('phone', phone)
    .maybeSingle()

  if (profileFetchErr) {
    logError('profile_fetch_error', profileFetchErr)
    return errorResponse('db_error', 500)
  }

  log('profile_lookup_result', {
    found:        !!existingProfile,
    has_password: !!existingProfile?.password_hash,
  })

  let userId: string

  if (existingProfile?.password_hash) {
    // ── Case B — fully registered already ─────────────────────────────────
    log('case_b_already_registered')
    return errorResponse('phone_already_registered', 409,
      'Un compte avec ce numéro existe déjà. Connecte-toi.')

  } else if (existingProfile?.id) {
    // ── Case C — profile exists, no password yet (incomplete registration) ─
    userId = existingProfile.id
    log('case_c_resume', { user_id: userId })

  } else {
    // ── Case A — new user, no profile with this phone ──────────────────────
    // Generate UUID and insert profile directly — no auth.users row needed.
    const newId = crypto.randomUUID()

    const { error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id:    newId,
        phone: phone,
        role:  'student',
      })

    if (insertErr) {
      logError('profile_insert_failed', insertErr, { code: insertErr.code })
      return errorResponse('db_error', 500)
    }

    userId = newId
    log('case_a_new_user', { user_id: userId })
  }

  // ── 7. Write full_name and password_hash ───────────────────────────────────
  const { error: profileUpdateErr } = await supabase
    .from('profiles')
    .update({ full_name: name, password_hash: passwordHash })
    .eq('id', userId)

  if (profileUpdateErr) {
    logError('profile_update_failed', profileUpdateErr, { code: profileUpdateErr.code })
    return errorResponse('db_error', 500)
  }
  log('profile_updated', { user_id: userId })

  // ── 8. Mark verification token used ───────────────────────────────────────
  await supabase
    .from('phone_verifications')
    .update({ used: true })
    .eq('id', verification.id)

  // ── 9. Create session ──────────────────────────────────────────────────────
  const sessionToken = generateToken()
  const sessionHash  = await sha256Hex(sessionToken)
  const expiresAt    = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error: sessionErr } = await supabase.from('auth_sessions').insert({
    user_id:    userId,
    token_hash: sessionHash,
    expires_at: expiresAt,
  })

  if (sessionErr) {
    logError('session_insert_failed', sessionErr, { code: sessionErr.code })
    return errorResponse('session_creation_failed', 500)
  }

  log('success', { user_id: userId })

  return jsonResponse({ success: true, session_token: sessionToken })
}
