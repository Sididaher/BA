import type { Profile, Lesson } from '@/types'

/**
 * Determines whether a student may access a lesson.
 *
 * Rules:
 *  - Admins always pass.
 *  - Non-protected lessons are open to everyone.
 *  - Protected lessons require an explicit entitlement row in student_lesson_access.
 *
 * entitledLessonIds must be pre-fetched for the student and passed in as a Set
 * so this function stays synchronous and can be called in tight loops (lesson lists).
 */
export function canAccessLesson(
  profile: Pick<Profile, 'role'>,
  lesson:  Pick<Lesson, 'id' | 'is_protected'>,
  entitledLessonIds: Set<string>,
): boolean {
  if (profile.role === 'admin') return true
  if (!lesson.is_protected)    return true
  return entitledLessonIds.has(lesson.id)
}
