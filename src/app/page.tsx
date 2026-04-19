import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/auth/session'
import LaunchScreen from '@/components/launch/LaunchScreen'

/**
 * Root landing page.
 * Authenticated users (valid DB session) are sent straight to their dashboard.
 * Unauthenticated users — or users with a stale/invalid cookie — see the
 * launch screen and can choose login or register freely.
 */
export default async function LandingPage() {
  const profile = await getSessionProfile()
  if (profile) {
    redirect(profile.role === 'admin' ? '/admin' : '/dashboard')
  }
  return <LaunchScreen />
}
