import { NextResponse } from 'next/server'
import { getSessionProfile } from '@/lib/auth/session'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  const profile = await getSessionProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { lessonId, eventType, metadata = {} } = await req.json()

    const svc = getServiceClient()
    const { error } = await svc.rpc('log_video_event', {
      p_user_id:    profile.id,
      p_lesson_id:  lessonId,
      p_event_type: eventType,
      p_metadata:   {
        ...metadata,
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        ua: req.headers.get('user-agent') || 'unknown'
      }
    })

    if (error) {
      console.error('[video-event] RPC Error:', error)
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[video-event] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
