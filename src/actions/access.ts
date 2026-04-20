'use server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

/**
 * Invalidates all pages whose rendered output depends on a student's entitlements.
 * Called after every grant/revoke so the Next.js Full Route Cache never serves stale data.
 * (Lesson pages also set `dynamic = 'force-dynamic'`, but course pages don't, so
 *  revalidation is needed there to refresh the lock icons.)
 */
function revalidateAccessCache(studentId: string) {
  revalidatePath('/courses', 'layout')   // refreshes all /courses/[slug] pages
  revalidatePath(`/admin/students/${studentId}/access`)
}

/** Returns the set of lesson IDs the student is entitled to access. */
export async function getStudentEntitlementIds(studentId: string): Promise<Set<string>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('student_lesson_access')
    .select('lesson_id')
    .eq('student_id', studentId)
  return new Set(data?.map(r => r.lesson_id) ?? [])
}

/** Returns full entitlement rows for the student (admin use). */
export async function getStudentEntitlements(studentId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('student_lesson_access')
    .select('*')
    .eq('student_id', studentId)
  return data ?? []
}

/** Grants a student access to a protected lesson. Admin-only action. */
export async function grantLessonAccess(studentId: string, lessonId: string) {
  const profile = await getSessionProfile()
  if (!profile || profile.role !== 'admin') return { error: 'unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('student_lesson_access')
    .upsert(
      { student_id: studentId, lesson_id: lessonId, granted_by: profile.id },
      { onConflict: 'student_id,lesson_id' },
    )

  revalidateAccessCache(studentId)
  return { error: error?.message ?? null }
}

/** Revokes a student's access to a protected lesson. Admin-only action. */
export async function revokeLessonAccess(studentId: string, lessonId: string) {
  const profile = await getSessionProfile()
  if (!profile || profile.role !== 'admin') return { error: 'unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('student_lesson_access')
    .delete()
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)

  revalidateAccessCache(studentId)
  return { error: error?.message ?? null }
}

/**
 * Checks whether a single student has access to a single lesson.
 * Used in the lesson-stream API route to avoid loading the full entitlement set.
 */
export async function hasLessonAccess(studentId: string, lessonId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('student_lesson_access')
    .select('id')
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)
    .maybeSingle()
  return !!data
}
