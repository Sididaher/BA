import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, SESSION_DAYS } from '@/lib/auth/session'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const token = body.token || body.session_token
    
    console.log('[set-session] RECEIVED BODY:', body)
    console.log('[set-session] EXTRACTED TOKEN:', token ? `${token.slice(0, 8)}...` : 'undefined')

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 24 * SESSION_DAYS,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[set-session] ERROR:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
