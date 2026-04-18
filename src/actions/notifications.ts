'use server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function getNotifications(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function markAllRead() {
  const profile = await getSessionProfile()
  if (!profile) return
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', profile.id)
    .eq('is_read', false)
  revalidatePath('/notifications')
}

export async function markRead(id: string) {
  const supabase = await createClient()
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  revalidatePath('/notifications')
}

export async function sendNotificationToAll(title: string, message: string) {
  const supabase = await createClient()
  const { data: students } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'student')
    .eq('is_active', true)
  if (!students?.length) return
  const rows = students.map(s => ({ user_id: s.id, title, message }))
  await supabase.from('notifications').insert(rows)
  revalidatePath('/admin/notifications')
}

export async function sendNotificationToUser(userId: string, title: string, message: string) {
  const supabase = await createClient()
  await supabase.from('notifications').insert({ user_id: userId, title, message })
  revalidatePath('/admin/notifications')
}
