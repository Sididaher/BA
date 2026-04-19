import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getSessionProfile } from '@/lib/auth/session'

export const runtime = 'nodejs'

// Signed URL lives 90 seconds — long enough to buffer, short enough to be useless if leaked
const SIGNED_URL_TTL = 90

// Max stream_access events per user in 60 seconds before flagging as suspicious
const RAPID_ACCESS_WINDOW_MS  = 60_000
const RAPID_ACCESS_THRESHOLD  = 8

function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  try {
    const baseHost = new URL(base).hostname
    const target   = new URL(url)
    if (target.hostname !== baseHost) return null
    const m = target.pathname.match(
      /^\/storage\/v1\/object\/(?:public|authenticated)\/([^/]+)\/(.+)$/
    )
    if (!m) return null
    return { bucket: m[1], path: decodeURIComponent(m[2]) }
  } catch {
    return null
  }
}

function getServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // ── 1. Authenticate ───────────────────────────────────────────────────────
  const profile = await getSessionProfile()
  if (!profile) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (!profile.is_active) {
    return NextResponse.json({ error: 'Compte inactif' }, { status: 403 })
  }

  // ── 2. Subscription gate (students only — admins bypass) ──────────────────
  if (profile.role === 'student') {
    if (profile.is_flagged) {
      return NextResponse.json({ error: 'Accès restreint suite à une activité suspecte' }, { status: 403 })
    }
    if (profile.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Abonnement requis pour accéder aux vidéos' }, { status: 403 })
    }
    if (
      profile.subscription_expires_at &&
      new Date(profile.subscription_expires_at) <= new Date()
    ) {
      return NextResponse.json({ error: 'Abonnement expiré' }, { status: 403 })
    }
  }

  const svc = getServiceClient()
  if (!svc) {
    return NextResponse.json({ error: 'Service non configuré' }, { status: 500 })
  }

  // ── 3. Rapid-access / multiple-session detection ──────────────────────────
  //    Fire-and-forget — never blocks the response
  void detectRapidAccess(id, profile.id, svc)

  // ── 4. Log stream access ──────────────────────────────────────────────────
  void logStreamAccess(id, profile.id, profile.role, request)

  // ── 5. Fetch lesson ───────────────────────────────────────────────────────
  const { data: lesson } = await svc
    .from('lessons')
    .select('id, video_url, hls_url, is_protected, is_downloadable, course:courses!inner(id, is_published)')
    .eq('id', id)
    .single()

  if (!lesson || (!lesson.video_url && !lesson.hls_url)) {
    return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404 })
  }

  // ── 6. Check course published (admins bypass) ─────────────────────────────
  const courseRaw = (lesson as unknown as {
    course: { id: string; is_published: boolean } | { id: string; is_published: boolean }[]
  }).course
  const course = Array.isArray(courseRaw) ? courseRaw[0] : courseRaw
  if (!course?.is_published && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // ── 7. Prefer HLS → then signed storage URL → then raw URL ───────────────
  const targetUrl = (lesson.hls_url ?? lesson.video_url) as string

  if (lesson.is_protected) {
    const storageInfo = parseStorageUrl(targetUrl)
    if (storageInfo) {
      const { data: signed, error } = await svc.storage
        .from(storageInfo.bucket)
        .createSignedUrl(storageInfo.path, SIGNED_URL_TTL)

      if (error || !signed?.signedUrl) {
        console.error('[lesson-stream] Failed to sign URL:', error?.message)
        return NextResponse.json({ error: 'Impossible de générer le lien sécurisé' }, { status: 502 })
      }
      return buildRedirect(signed.signedUrl)
    }
    return buildRedirect(targetUrl)
  }

  return buildRedirect(targetUrl)
}

function buildRedirect(url: string): NextResponse {
  const res = NextResponse.redirect(url, { status: 302 })
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Content-Security-Policy', "frame-ancestors 'self'")
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  return res
}

async function logStreamAccess(
  lessonId: string,
  userId:   string,
  role:     string,
  request:  NextRequest,
) {
  try {
    const svc = getServiceClient()
    if (!svc) return
    await svc.from('video_events').insert({
      user_id:    userId,
      lesson_id:  lessonId,
      event_type: 'stream_access',
      metadata: {
        role,
        ip:      request.headers.get('x-forwarded-for') ?? 'unknown',
        ua:      (request.headers.get('user-agent') ?? '').slice(0, 200),
        referer: request.headers.get('referer') ?? '',
      },
    })
  } catch {
    // Never fail the stream over a logging error
  }
}

async function detectRapidAccess(
  lessonId: string,
  userId:   string,
  svc:      ReturnType<typeof getServiceClient>,
) {
  try {
    if (!svc) return
    const since = new Date(Date.now() - RAPID_ACCESS_WINDOW_MS).toISOString()
    const { count } = await svc
      .from('video_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'stream_access')
      .gte('created_at', since)

    if ((count ?? 0) >= RAPID_ACCESS_THRESHOLD) {
      await svc.from('video_events').insert({
        user_id:    userId,
        lesson_id:  lessonId,
        event_type: 'multiple_sessions_detected',
        metadata:   { recent_access_count: count, window_ms: RAPID_ACCESS_WINDOW_MS },
      })
    }
  } catch {
    // Never fail the stream over detection logic
  }
}
