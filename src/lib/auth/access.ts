import type { Profile } from '@/types'

/**
 * Single source of truth for lesson access control.
 *
 * Rules:
 *  - Admins always have access (preview + management).
 *  - Non-protected lessons are open to any authenticated user.
 *  - Protected lessons require an active (paid) account.
 *    is_active is set by the admin when a student pays/enrolls.
 */
export function canAccessLesson(
  profile: Pick<Profile, 'role' | 'is_active'>,
  lesson:  { is_protected: boolean },
): boolean {
  if (profile.role === 'admin') return true
  if (!lesson.is_protected)    return true
  return profile.is_active === true
}
