'use server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function getUserProgress(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
  return data ?? []
}

export async function markLessonCompleted(lessonId: string) {
  const profile = await getSessionProfile()
  if (!profile) return
  const supabase = await createClient()
  await supabase.from('user_progress').upsert({
    user_id:      profile.id,
    lesson_id:    lessonId,
    completed:    true,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,lesson_id' })
  await supabase.from('history').insert({ user_id: profile.id, lesson_id: lessonId })
  revalidatePath('/dashboard')
}

export async function updateWatchedSeconds(lessonId: string, seconds: number) {
  const profile = await getSessionProfile()
  if (!profile) return
  const supabase = await createClient()
  await supabase.from('user_progress').upsert({
    user_id:         profile.id,
    lesson_id:       lessonId,
    watched_seconds: seconds,
  }, { onConflict: 'user_id,lesson_id' })
}

export async function getDashboardStats(userId: string) {
  const supabase = await createClient()
  const [progress, notes, favorites] = await Promise.all([
    supabase.from('user_progress').select('*').eq('user_id', userId),
    supabase.from('notes').select('id').eq('user_id', userId),
    supabase.from('favorites').select('id').eq('user_id', userId),
  ])
  const completedLessons = progress.data?.filter(p => p.completed).length ?? 0
  return {
    completedLessons,
    totalNotes:     notes.data?.length ?? 0,
    totalFavorites: favorites.data?.length ?? 0,
    inProgress:     progress.data?.filter(p => !p.completed && p.watched_seconds > 0).length ?? 0,
  }
}
