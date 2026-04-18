import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/session'

const PUBLIC_PATHS = new Set(['/', '/login', '/verify-otp', '/register'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Never intercept API routes or internal Next.js paths.
  if (pathname.startsWith('/api/')) return NextResponse.next()

  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value

  // No cookie at all → definitely not logged in → redirect to login.
  // This is safe: absence of cookie cannot be a false negative.
  if (!hasSession && !PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Do NOT redirect based on cookie presence alone.
  // A cookie may be stale/expired. DB validation happens in:
  //   - (public)/layout.tsx  → redirects valid sessions away from auth pages
  //   - (student)/layout.tsx → requireAuth()
  //   - admin/layout.tsx     → requireAdmin()

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
