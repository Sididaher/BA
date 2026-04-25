import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendValidationSms } from '../_shared/chinguisoft.ts'

/**
 * send-otp: Generates a 6-digit OTP, hashes it, saves to DB, and sends via SMS.
 * Schema columns: [id, phone, code_hash, expires_at, attempts, verified, created_at]
 */

const RATE_WINDOW_MS     = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT         = 3
const OTP_EXPIRY_SECONDS = 300             // 5 minutes
const MAURITANIAN_PHONE  = /^\+222[234678]\d{7}$/

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Structured logger ───────────────────────────────────────────────────────

function log(step: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ fn: 'send-otp', step, ts: new Date().toISOString(), ...data }))
}

function logError(step: string, err: unknown, extra?: Record<string, unknown>) {
  console.error(JSON.stringify({
    fn: 'send-otp', step, ts: new Date().toISOString(),
    error: err instanceof Error ? err.message : String(err),
    ...extra,
  }))
}

// ─── Response helpers ────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function errorResponse(error: string, status: number, details?: string): Response {
  return jsonResponse({ success: false, error, ...(details ? { details } : {}) }, status)
}

// ─── Crypto helpers ──────────────────────────────────────────────────────────

async function hashCode(code: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateOtp(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes).map(b => b % 10).join('')
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS })

  log('request_received')

  try {
    return await handleRequest(req)
  } catch (err) {
    logError('unhandled_exception', err)
    return errorResponse('internal_error', 500,
      err instanceof Error ? err.message : String(err))
  }
})

async function handleRequest(req: Request): Promise<Response> {

  // ── 1. Read ALL env vars first ────────────────────────────────────────────
  const SUPABASE_URL                = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const CHINGUISOFT_BASE_URL        = Deno.env.get('CHINGUISOFT_BASE_URL')
  const CHINGUISOFT_VALIDATION_KEY  = Deno.env.get('CHINGUISOFT_VALIDATION_KEY')
  const CHINGUISOFT_VALIDATION_TOKEN = Deno.env.get('CHINGUISOFT_VALIDATION_TOKEN')

  // ── 2. Log presence (booleans only — never log values) ───────────────────
  log('env_check', {
    SUPABASE_URL:                 !!SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:    !!SUPABASE_SERVICE_ROLE_KEY,
    CHINGUISOFT_BASE_URL:         !!CHINGUISOFT_BASE_URL,
    CHINGUISOFT_VALIDATION_KEY:   !!CHINGUISOFT_VALIDATION_KEY,
    CHINGUISOFT_VALIDATION_TOKEN: !!CHINGUISOFT_VALIDATION_TOKEN,
  })

  // ── 3. Validate Supabase secrets ─────────────────────────────────────────
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [
      !SUPABASE_URL              && 'SUPABASE_URL',
      !SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean)
    logError('missing_supabase_secrets', `Missing: ${missing.join(', ')}`)
    return errorResponse('missing_supabase_secrets', 500)
  }

  // ── 4. Validate ChinguiSoft secrets — each checked individually ──────────
  //    URL construction happens AFTER this block, never before.
  if (!CHINGUISOFT_BASE_URL) {
    logError('missing_chinguisoft_secrets', 'CHINGUISOFT_BASE_URL is not set')
    return errorResponse('missing_chinguisoft_secrets', 500, 'CHINGUISOFT_BASE_URL missing')
  }
  if (!CHINGUISOFT_VALIDATION_KEY) {
    logError('missing_chinguisoft_secrets', 'CHINGUISOFT_VALIDATION_KEY is not set')
    return errorResponse('missing_chinguisoft_secrets', 500, 'CHINGUISOFT_VALIDATION_KEY missing')
  }
  if (!CHINGUISOFT_VALIDATION_TOKEN) {
    logError('missing_chinguisoft_secrets', 'CHINGUISOFT_VALIDATION_TOKEN is not set')
    return errorResponse('missing_chinguisoft_secrets', 500, 'CHINGUISOFT_VALIDATION_TOKEN missing')
  }

  // From here, TypeScript knows all five vars are `string` (not `string | undefined`)
  // because the early-return guards above have narrowed them.

  // ── 5. Parse and validate phone ───────────────────────────────────────────
  let phone: string
  try {
    const body = await req.json()
    phone = body?.phone ?? ''
  } catch (err) {
    logError('parse_body', err)
    return errorResponse('invalid_request_body', 400)
  }

  if (!MAURITANIAN_PHONE.test(phone)) {
    log('phone_validation_failed', { phone_length: phone?.length ?? 0 })
    return errorResponse('invalid_phone', 400, 'Numéro mauritanien invalide (+222...)')
  }

  log('phone_validated')

  // ── 6. Supabase client (service role) ─────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 7. Rate-limit check ───────────────────────────────────────────────────
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count, error: countErr } = await supabase
    .from('otp_requests')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', windowStart)

  if (countErr) {
    logError('rate_limit_query', countErr, { code: countErr.code, hint: countErr.hint })
    return errorResponse('db_error', 500, `${countErr.code}: ${countErr.message}`)
  }

  log('rate_limit_checked', { count })

  if ((count ?? 0) >= RATE_LIMIT) {
    return errorResponse('rate_limit_exceeded', 429)
  }

  // ── 8. Invalidate previous pending OTPs ───────────────────────────────────
  const { error: invalidateErr } = await supabase
    .from('otp_requests')
    .update({ verified: true })
    .eq('phone', phone)
    .eq('verified', false)

  if (invalidateErr) {
    // Non-fatal — old OTPs expire naturally
    logError('invalidate_old_otps', invalidateErr, { code: invalidateErr.code })
  } else {
    log('old_otps_invalidated')
  }

  // ── 9. Generate OTP and store hash ────────────────────────────────────────
  const code      = generateOtp()
  const codeHash  = await hashCode(code)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000).toISOString()

  log('db_insert_attempt', { expires_at: expiresAt })

  const { error: insertErr } = await supabase.from('otp_requests').insert({
    phone,
    code_hash:  codeHash,
    expires_at: expiresAt,
    attempts:   0,
    verified:   false,
  })

  if (insertErr) {
    logError('db_insert_failed', insertErr, {
      code:   insertErr.code,
      hint:   insertErr.hint,
      detail: insertErr.details,
    })
    return errorResponse('db_insert_failed', 500, `${insertErr.code}: ${insertErr.message}`)
  }

  log('db_insert_success')

  // ── 10. Log SMS attempt — URL is built inside sendValidationSms ──────────
  log('sms_request_started')

  // ── 11. Send SMS via ChinguiSoft validation endpoint ─────────────────────
  let smsResult: { ok: boolean; status: number; body: string }

  try {
    smsResult = await sendValidationSms(
      phone,
      code,
      {
        baseUrl:         CHINGUISOFT_BASE_URL,
        validationKey:   CHINGUISOFT_VALIDATION_KEY,
        validationToken: CHINGUISOFT_VALIDATION_TOKEN,
      },
    )
  } catch (fetchErr) {
    logError('sms_fetch_threw', fetchErr)
    // Roll back DB row so rate counter stays accurate
    await supabase.from('otp_requests').delete().eq('code_hash', codeHash)
    log('rollback_success', { reason: 'fetch_threw' })
    return errorResponse('sms_network_error', 502,
      fetchErr instanceof Error ? fetchErr.message : String(fetchErr))
  }

  log('sms_response_received', {
    http_status:  smsResult.status,
    ok:           smsResult.ok,
    body_preview: smsResult.body,   // already trimmed to 500 chars in adapter
  })

  if (!smsResult.ok) {
    logError('sms_provider_error', `non-2xx from ChinguiSoft`, {
      http_status: smsResult.status,
      body:        smsResult.body,
    })
    await supabase.from('otp_requests').delete().eq('code_hash', codeHash)
    log('rollback_success', { reason: 'sms_provider_error' })
    return errorResponse('sms_provider_error', 502,
      `HTTP ${smsResult.status}: ${smsResult.body}`)
  }

  // ── 12. Success ───────────────────────────────────────────────────────────
  log('success')
  return jsonResponse({ success: true })
}
