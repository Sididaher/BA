import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/auth/session'

/**
 * Layout for unauthenticated pages (login, register, verify-otp, landing).
 * If a valid session exists in the DB, redirect to the role-appropriate page.
 * A stale cookie that has no matching DB row will be cleared by getSessionProfile()
 * and treated as logged out — no redirect happens.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile()
  if (profile) {
    redirect(profile.role === 'admin' ? '/admin' : '/dashboard')
  }
  return <>{children}</>
}
