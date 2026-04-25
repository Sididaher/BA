'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAllStudents() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_all_students')
  if (error) {
    console.error('[getAllStudents] RPC Error:', error)
    return []
  }
  return data as any[]
}

export async function toggleStudentActive(id: string, current: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_toggle_student_active', {
    p_student_id: id,
    p_is_active: !current
  })
  if (error) {
    console.error('[toggleStudentActive] RPC Error:', error)
    throw new Error('Failed to toggle status')
  }
  revalidatePath('/admin/students')
}
