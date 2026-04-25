'use server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function getFavorites(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('favorites')
    .select('*, course:courses(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function toggleFavorite(courseId: string) {
  const profile = await getSessionProfile()
  if (!profile) return
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', profile.id)
    .eq('course_id', courseId)
    .single()
  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id)
  } else {
    await supabase.from('favorites').insert({ user_id: profile.id, course_id: courseId })
  }
  revalidatePath('/favorites')
  revalidatePath('/courses')
}
