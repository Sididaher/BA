import { redirect } from 'next/navigation'
import { getSessionProfile, clearSession } from './session'
import type { Profile } from '@/types'

export async function requireAuth(): Promise<{ profile: Profile }> {
  const profile = await getSessionProfile()
  if (!profile)          redirect('/login')
  if (!profile.is_active) redirect('/login')
  return { profile }
}

export async function requireAdmin(): Promise<{ profile: Profile }> {
  const profile = await getSessionProfile()
  if (!profile)                            redirect('/login')
  if (!profile.is_active)                  redirect('/login')
  if (profile.role !== 'admin')            redirect('/dashboard')
  return { profile }
}

export async function getProfile(): Promise<Profile | null> {
  return getSessionProfile()
}

export async function logout(): Promise<never> {
  await clearSession()
  redirect('/login')
}
