'use server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function getNotes(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notes')
    .select('*, lesson:lessons(id, title, course_id, course:courses(id, title, slug))')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  return data ?? []
}

export async function upsertNote(lessonId: string, title: string, content: string, noteId?: string) {
  const profile = await getSessionProfile()
  if (!profile) return
  const supabase = await createClient()
  if (noteId) {
    await supabase.from('notes')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('user_id', profile.id)  // safety: only own notes
  } else {
    await supabase.from('notes')
      .insert({ user_id: profile.id, lesson_id: lessonId, title, content })
  }
  revalidatePath('/notes')
}

export async function deleteNote(id: string) {
  const profile = await getSessionProfile()
  if (!profile) return
  const supabase = await createClient()
  await supabase.from('notes').delete().eq('id', id).eq('user_id', profile.id)
  revalidatePath('/notes')
}
