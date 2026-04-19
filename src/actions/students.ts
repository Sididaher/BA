'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAllStudents() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function toggleStudentActive(id: string, current: boolean) {
  const supabase = await createClient()
  await supabase.from('profiles').update({ is_active: !current }).eq('id', id)
  revalidatePath('/admin/students')
}

export async function getStudentCount() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
  return count ?? 0
}
