import { redirect } from 'next/navigation'
import { getSessionProfile } from './session'
import type { Profile } from '@/types'

export async function requireAuth(): Promise<{ profile: Profile }> {
  const profile = await getSessionProfile()
  
  if (!profile) {
    console.log('[AUTH] requireAuth: No profile, redirecting to /login')
    redirect('/login')
  }
  
  if (!profile.is_active) {
    console.log('[AUTH] requireAuth: Inactive profile, redirecting to /suspended')
    redirect('/suspended')
  }
  
  return { profile }
}

export async function requireAdmin(): Promise<{ profile: Profile }> {
  const { profile } = await requireAuth()
  
  if (profile.role !== 'admin') {
    console.log('[AUTH] requireAdmin: Not an admin, redirecting to /dashboard')
    redirect('/dashboard')
  }
  
  return { profile }
}

export async function getProfile(): Promise<Profile | null> {
  return getSessionProfile()
}

export async function logout(): Promise<never> {
  // logout helper for server actions
  redirect('/login')
}
