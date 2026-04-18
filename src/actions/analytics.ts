'use server'
import { createClient } from '@/lib/supabase/server'

export async function getAdminOverview() {
  const supabase = await createClient()
  const [students, courses, lessons, progress, notifications] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('user_progress').select('*', { count: 'exact', head: true }).eq('completed', true),
    supabase.from('notifications').select('*', { count: 'exact', head: true }),
  ])
  return {
    totalStudents: students.count ?? 0,
    totalCourses: courses.count ?? 0,
    totalLessons: lessons.count ?? 0,
    completedLessons: progress.count ?? 0,
    totalNotifications: notifications.count ?? 0,
  }
}

export async function getRecentStudents() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

export async function getTopCourses() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, lessons(count)')
    .eq('is_published', true)
    .order('rating', { ascending: false })
    .limit(5)
  return data ?? []
}
