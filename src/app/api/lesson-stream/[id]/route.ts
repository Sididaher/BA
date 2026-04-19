import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getSessionProfile } from '@/lib/auth/session'

export const runtime = 'nodejs'

const SIGNED_URL_TTL = 3600 // 1 hour

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

  // ── 1. Validate custom session ───────────────────────────────────────────
  const profile = await getSessionProfile()
  if (!profile) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (!profile.is_active) {
    return NextResponse.json({ error: 'Compte inactif' }, { status: 403 })
  }

  // ── 2. Fetch lesson ───────────────────────────────────────────────────────
  const svc = getServiceClient()
  if (!svc) {
    return NextResponse.json({ error: 'Service non configuré' }, { status: 500 })
  }

  const { data: lesson } = await svc
    .from('lessons')
    .select('id, video_url, is_protected, is_downloadable, course:courses!inner(id, is_published)')
    .eq('id', id)
    .single()

  if (!lesson || !lesson.video_url) {
    return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404 })
  }

  // ── 3. Check course published (admins bypass) ─────────────────────────────
  const courseRaw = (lesson as unknown as {
    course: { id: string; is_published: boolean } | { id: string; is_published: boolean }[]
  }).course
  const course = Array.isArray(courseRaw) ? courseRaw[0] : courseRaw
  if (!course?.is_published && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const rawUrl = lesson.video_url

  // ── 4. Protected lesson → signed URL ──────────────────────────────────────
  if (lesson.is_protected) {
    const storageInfo = parseStorageUrl(rawUrl)
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
    return buildRedirect(rawUrl)
  }

  // ── 5. Non-protected lesson ───────────────────────────────────────────────
  return buildRedirect(rawUrl)
}

function buildRedirect(url: string): NextResponse {
  const res = NextResponse.redirect(url, { status: 302 })
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.headers.set('Pragma', 'no-cache')
  return res
}
