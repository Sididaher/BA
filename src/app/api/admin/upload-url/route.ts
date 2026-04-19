import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionProfile } from '@/lib/auth/session'

export const runtime = 'nodejs'

const BUCKET = 'lesson-videos'
// Signed upload URL is valid for 5 minutes — enough for any admin action
const UPLOAD_URL_TTL = 300

const ALLOWED_CONTENT_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/avi',
])

const EXT_WHITELIST = new Set(['mp4', 'webm', 'ogv', 'ogg', 'mov', 'avi'])

export async function POST(req: NextRequest) {
  // Admin-only endpoint
  const profile = await getSessionProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { ext?: string; contentType?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const contentType = body.contentType?.toLowerCase() ?? ''
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: 'Format non accepté. Utilisez MP4, WebM, OGG ou MOV.' },
      { status: 400 },
    )
  }

  const rawExt = (body.ext ?? 'mp4').toLowerCase().replace(/^\./, '')
  const safeExt = EXT_WHITELIST.has(rawExt) ? rawExt : 'mp4'
  // Unique path — no user data in the filename so it cannot be guessed
  const path = `videos/${crypto.randomUUID()}.${safeExt}`

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data, error } = await svc.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: false })

  if (error || !data?.signedUrl) {
    console.error('[upload-url] Failed to create signed upload URL:', error?.message)
    return NextResponse.json(
      { error: 'Impossible de créer le lien d\'upload' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    path,
    bucket: BUCKET,
    signedUrl: data.signedUrl,
    token: data.token,
  })
}
