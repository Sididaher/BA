'use server'
import { createClient } from '@/lib/supabase/server'

export async function getAdminOverview() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_overview')
  if (error) {
    console.error('[getAdminOverview] RPC Error:', error)
    return {
      totalStudents: 0,
      totalCourses: 0,
      totalLessons: 0,
      completedLessons: 0,
      totalNotifications: 0,
    }
  }
  return data as {
    totalStudents: number
    totalCourses: number
    totalLessons: number
    completedLessons: number
    totalNotifications: number
  }
}

export async function getMonitoringStats() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_monitoring_stats')
  if (error) {
    console.error('[getMonitoringStats] RPC Error:', error)
    return { recent_events: [], suspicious_activity: [] }
  }
  return data as { recent_events: any[]; suspicious_activity: any[] }
}

export async function getRecentStudents() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_recent_students')
  if (error) {
    console.error('[getRecentStudents] RPC Error:', error)
    return []
  }
  return data as any[]
}

export async function getTopCourses() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_top_courses')
  if (error) {
    console.error('[getTopCourses] RPC Error:', error)
    return []
  }
  return data as any[]
}

export async function getAnalytics() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_analytics')
  if (error) {
    console.error('[getAnalytics] RPC Error:', error)
    return { top_courses: [], active_students_count: 0 }
  }
  return data as { top_courses: any[]; active_students_count: number }
}
