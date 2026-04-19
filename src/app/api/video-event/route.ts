import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionProfile } from '@/lib/auth/session'

export const runtime = 'nodejs'

const ALLOWED_EVENTS = new Set([
  'stream_access',
  'seek_abuse',
  'tab_hidden',
  'playback_started',
  'playback_completed',
  'multiple_sessions_detected',
])

export async function POST(req: NextRequest) {
  const profile = await getSessionProfile()
  if (!profile) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let body: { lesson_id?: string; event_type?: string; metadata?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const { lesson_id, event_type, metadata = {} } = body
  if (!lesson_id || typeof lesson_id !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (!event_type || typeof event_type !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (!ALLOWED_EVENTS.has(event_type)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    await db.from('video_events').insert({
      user_id:    profile.id,
      lesson_id,
      event_type,
      metadata: {
        ...metadata,
        ip: req.headers.get('x-forwarded-for') ?? 'unknown',
        ua: (req.headers.get('user-agent') ?? '').slice(0, 200),
      },
    })
  } catch {
    // Return 200 even on DB failure — client should never retry telemetry
  }

  return NextResponse.json({ ok: true })
}
