'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getStudentEntitlementIds(studentId: string): Promise<Set<string>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_student_access_state', {
    p_student_id: studentId
  })

  if (error || !data) {
    console.error('[access] Error fetching access state:', error)
    return new Set()
  }

  const entitledIds = new Set<string>(
    (data as any[])
      .filter(r => r.has_access)
      .map(r => r.lesson_id)
  )

  return entitledIds
}

export async function grantLessonAccess(studentId: string, lessonId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_set_lesson_access', {
    p_student_id: studentId,
    p_lesson_id:  lessonId,
    p_has_access: true
  })

  if (error) {
    console.error('[access] Error granting access:', error)
    throw new Error('Failed to grant access')
  }

  revalidatePath(`/admin/students/${studentId}/access`)
}

export async function revokeLessonAccess(studentId: string, lessonId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_set_lesson_access', {
    p_student_id: studentId,
    p_lesson_id:  lessonId,
    p_has_access: false
  })

  if (error) {
    console.error('[access] Error revoking access:', error)
    throw new Error('Failed to revoke access')
  }

  revalidatePath(`/admin/students/${studentId}/access`)
}
