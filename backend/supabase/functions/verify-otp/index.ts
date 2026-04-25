import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * verify-otp: Validates OTP, then issues a short-lived phone_verified_token.
 *
 * The phone_verified_token is stored (hashed) in phone_verifications and
 * expires in 10 minutes. The client passes it to finalize-registration to
 * complete account creation.
 *
 * This function does NOT create the auth user or a session — that happens
 * only after the user sets their password in finalize-registration.
 */

const MAX_ATTEMPTS           = 5
const VERIFICATION_EXPIRY_MS = 10 * 60 * 1000  // 10 minutes
const MAURITANIAN_PHONE      = /^\+222[234678]\d{7}$/

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function log(step: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ fn: 'verify-otp', step, ts: new Date().toISOString(), ...data }))
}
function logError(step: string, err: unknown, extra?: Record<string, unknown>) {
  console.error(JSON.stringify({
    fn: 'verify-otp', step, ts: new Date().toISOString(),
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
  const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logError('missing_env', 'Supabase secrets not set')
    return errorResponse('missing_env_vars', 500)
  }

  let phone: string
  let code:  string
  try {
    const body = await req.json()
    phone = (body?.phone ?? '').trim()
    code  = (body?.code  ?? '').trim()
  } catch (err) {
    logError('parse_body', err)
    return errorResponse('invalid_request_body', 400)
  }

  log('input_parsed', { phone_prefix: phone.slice(0, 6), code_length: code.length })

  if (!MAURITANIAN_PHONE.test(phone)) return errorResponse('invalid_phone', 400)
  if (!/^\d{6}$/.test(code))          return errorResponse('invalid_code_format', 400)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── Fetch latest pending OTP ──────────────────────────────────────────────
  const { data: otpRow, error: fetchErr } = await supabase
    .from('otp_requests')
    .select('id, code_hash, attempts, expires_at')
    .eq('phone', phone)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) {
    logError('db_fetch_error', fetchErr)
    return errorResponse('db_error', 500)
  }

  log('db_fetch_result', { found: !!otpRow, record_id: otpRow?.id })

  if (!otpRow) return errorResponse('otp_not_found', 400)

  // ── Expiry ────────────────────────────────────────────────────────────────
  if (new Date() > new Date(otpRow.expires_at)) {
    return errorResponse('code_expired', 400)
  }

  // ── Attempts guard ────────────────────────────────────────────────────────
  if (otpRow.attempts >= MAX_ATTEMPTS) return errorResponse('too_many_attempts', 429)

  // ── Hash comparison ───────────────────────────────────────────────────────
  const providedHash = await sha256Hex(code)
  const hashMatch    = providedHash === otpRow.code_hash

  log('hash_comparison', {
    match:           hashMatch,
    provided_prefix: providedHash.slice(0, 8),
    stored_prefix:   otpRow.code_hash.slice(0, 8),
  })

  if (!hashMatch) {
    await supabase.from('otp_requests').update({ attempts: otpRow.attempts + 1 }).eq('id', otpRow.id)
    return errorResponse('invalid_code', 400)
  }

  // ── Mark OTP used ─────────────────────────────────────────────────────────
  await supabase.from('otp_requests').update({ verified: true }).eq('id', otpRow.id)
  log('otp_verified', { record_id: otpRow.id })

  // ── Issue phone_verified_token (not a session) ────────────────────────────
  const rawToken  = generateToken()
  const tokenHash = await sha256Hex(rawToken)
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_MS).toISOString()

  const { error: insertErr } = await supabase.from('phone_verifications').insert({
    phone,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  if (insertErr) {
    logError('verification_token_insert_failed', insertErr)
    return errorResponse('db_error', 500)
  }

  log('verification_token_issued', { expires_at: expiresAt })

  return jsonResponse({
    success:               true,
    phone_verified_token:  rawToken,   // client passes this to finalize-registration
  })
}
