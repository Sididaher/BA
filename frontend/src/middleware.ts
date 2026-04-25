import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, validateSession } from '@/lib/auth/session'

const PUBLIC_PATHS = new Set(['/', '/login', '/verify-otp', '/register', '/suspended'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Skip API and assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/icons/') ||
    pathname === '/apple-icon' ||
    pathname === '/manifest.webmanifest' ||
    pathname.includes('.') // skip files
  ) {
    return NextResponse.next()
  }

  // Safety check for env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[MW] Missing environment variables for auth validation')
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const isPublicPath = PUBLIC_PATHS.has(pathname)

  console.log(`[MW] Request: ${pathname} | Cookie: ${!!token}`)

  // 2. No token case
  if (!token) {
    if (!isPublicPath) {
      console.log(`[MW] No token, protected path -> redirect /login`)
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // 3. Token exists -> Validate against DB
  const profile = await validateSession(token)

  // 4. Stale/Invalid token case
  if (!profile) {
    console.log(`[MW] Stale token -> clearing cookie and redirecting if needed`)
    const response = isPublicPath 
      ? NextResponse.next() 
      : NextResponse.redirect(new URL('/login', request.url))
    
    response.cookies.delete(SESSION_COOKIE)
    return response
  }

  // 5. Inactive user case
  if (!profile.is_active && pathname !== '/suspended') {
    console.log(`[MW] User inactive -> redirect /suspended`)
    return NextResponse.redirect(new URL('/suspended', request.url))
  }

  // 6. Active user role-based redirects
  if (profile.is_active) {
    // If on public auth pages, redirect to home base
    if (pathname === '/login' || pathname === '/register' || pathname === '/verify-otp') {
      const dest = profile.role === 'admin' ? '/admin' : '/dashboard'
      console.log(`[MW] Already logged in -> redirect ${dest}`)
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // Protect admin routes
    if (pathname.startsWith('/admin') && profile.role !== 'admin') {
      console.log(`[MW] Student tried admin -> redirect /dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Protect student routes (optional, usually students can see public pages, but let's be strict if desired)
    if (pathname.startsWith('/dashboard') && profile.role === 'admin') {
      console.log(`[MW] Admin tried dashboard -> redirect /admin`)
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
