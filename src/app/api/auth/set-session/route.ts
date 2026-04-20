import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashToken, SESSION_COOKIE, SESSION_DAYS } from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('set-session: missing env vars')
    return NextResponse.json({ success: false, error: 'missing_env_vars' }, { status: 500 })
  }
  try {
    let session_token: string | undefined
    try {
      const body = await req.json()
      session_token = body?.session_token
    } catch {
      return NextResponse.json({ success: false, error: 'invalid_request_body' }, { status: 400 })
    }

    if (!session_token || typeof session_token !== 'string') {
      return NextResponse.json({ success: false, error: 'missing_session_token' }, { status: 400 })
    }

    const tokenHash = await hashToken(session_token)

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: session, error: sessionErr } = await db
      .from('auth_sessions')
      .select('id, user_id, expires_at')
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (sessionErr) {
      console.error('set-session db error', sessionErr.message)
      return NextResponse.json({ success: false, error: 'db_error' }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({ success: false, error: 'invalid_or_expired_token' }, { status: 401 })
    }

    // Fetch profile role so the caller can redirect to the right landing page.
    const { data: profile, error: profileErr } = await db
      .from('profiles')
      .select('role')
      .eq('id', session.user_id)
      .single()

    if (profileErr) {
      console.error('set-session profile fetch error', profileErr.message)
      return NextResponse.json({ success: false, error: 'profile_fetch_failed' }, { status: 500 })
    }

    const role: string = profile?.role ?? 'student'

    // Send a one-time welcome notification to new students.
    // We check whether any notification already exists for this user so the
    // message is never duplicated on repeated logins or re-registrations.
    if (role === 'student') {
      try {
        const { count } = await db
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user_id)

        if (count === 0) {
          const studentName = (
            await db.from('profiles').select('full_name').eq('id', session.user_id).single()
          ).data?.full_name ?? 'Étudiant'

          const firstName = studentName.split(' ')[0]
          await db.from('notifications').insert({
            user_id: session.user_id,
            title:   `Bienvenue sur BA, ${firstName} !`,
            message:
              `Bonjour ${firstName}, nous sommes ravis de t'accueillir sur BA. ` +
              `Explore les cours disponibles et commence ton apprentissage dès maintenant. ` +
              `Bonne continuation !`,
          })
        }
      } catch {
        // Never fail the session setup over a notification error
      }
    }

    const response = NextResponse.json({ success: true, role })
    response.cookies.set(SESSION_COOKIE, session_token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   SESSION_DAYS * 24 * 60 * 60,
    })
    return response

  } catch (err) {
    console.error('set-session unhandled error', err)
    return NextResponse.json({ success: false, error: 'set_session_failed' }, { status: 500 })
  }
}
