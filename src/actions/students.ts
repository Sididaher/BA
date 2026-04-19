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

export async function setStudentSubscription(id: string, months: number) {
  const supabase = await createClient()
  if (months <= 0) {
    await supabase
      .from('profiles')
      .update({ subscription_status: 'none', subscription_expires_at: null })
      .eq('id', id)
  } else {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + months)
    await supabase
      .from('profiles')
      .update({
        subscription_status:     'active',
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq('id', id)
  }
  revalidatePath('/admin/students')
}

export async function toggleStudentFlag(id: string, currentFlag: boolean, reason?: string) {
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({
      is_flagged:  !currentFlag,
      flag_reason: !currentFlag ? (reason ?? 'Signalé manuellement par l\'admin') : null,
    })
    .eq('id', id)
  revalidatePath('/admin/students')
  revalidatePath('/admin/video-monitoring')
}
