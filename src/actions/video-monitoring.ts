'use server'
import { createClient } from '@/lib/supabase/server'

export interface VideoEventRow {
  id: string
  user_id: string
  lesson_id: string
  event_type: string
  metadata: Record<string, unknown>
  created_at: string
  profile: { full_name: string | null; phone: string | null } | null
  lesson:  { title: string } | null
}

export interface SuspiciousStudent {
  user_id: string
  full_name: string | null
  phone: string | null
  seek_abuse_count: number
  tab_hidden_count: number
  total: number
}

export interface LessonVideoStat {
  lesson_id: string
  title: string
  stream_access_count: number
  seek_abuse_count: number
  tab_hidden_count: number
}

export interface VideoEventOverview {
  total: number
  stream_access: number
  seek_abuse: number
  tab_hidden: number
  today: number
  this_week: number
  unique_students: number
}

export async function getVideoEventOverview(): Promise<VideoEventOverview> {
  const supabase = await createClient()
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfWeek  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()

  const [all, todayRes, weekRes] = await Promise.all([
    supabase.from('video_events').select('event_type, user_id'),
    supabase.from('video_events').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday),
    supabase.from('video_events').select('id', { count: 'exact', head: true }).gte('created_at', startOfWeek),
  ])

  const rows = all.data ?? []
  const uniqueStudents = new Set(rows.map(r => r.user_id)).size

  return {
    total:          rows.length,
    stream_access:  rows.filter(r => r.event_type === 'stream_access').length,
    seek_abuse:     rows.filter(r => r.event_type === 'seek_abuse').length,
    tab_hidden:     rows.filter(r => r.event_type === 'tab_hidden').length,
    today:          todayRes.count ?? 0,
    this_week:      weekRes.count  ?? 0,
    unique_students: uniqueStudents,
  }
}

export async function getVideoEvents(filters: {
  event_type?: string
  student_id?: string
  lesson_id?:  string
  from?:       string
  to?:         string
  limit?:      number
}): Promise<VideoEventRow[]> {
  const supabase = await createClient()
  let q = supabase
    .from('video_events')
    .select(`
      id, user_id, lesson_id, event_type, metadata, created_at,
      profile:profiles!user_id(full_name, phone),
      lesson:lessons!lesson_id(title)
    `)
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 100)

  if (filters.event_type && filters.event_type !== 'all') q = q.eq('event_type', filters.event_type)
  if (filters.student_id)  q = q.eq('user_id',   filters.student_id)
  if (filters.lesson_id)   q = q.eq('lesson_id', filters.lesson_id)
  if (filters.from)        q = q.gte('created_at', filters.from)
  if (filters.to)          q = q.lte('created_at', filters.to)

  const { data } = await q
  return (data ?? []) as unknown as VideoEventRow[]
}

export async function getSuspiciousStudents(): Promise<SuspiciousStudent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('video_events')
    .select('user_id, event_type, profile:profiles!user_id(full_name, phone)')
    .in('event_type', ['seek_abuse', 'tab_hidden'])

  if (!data) return []

  const map = new Map<string, SuspiciousStudent>()
  for (const row of data as unknown as { user_id: string; event_type: string; profile: { full_name: string | null; phone: string | null } | null }[]) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, {
        user_id: row.user_id,
        full_name: row.profile?.full_name ?? null,
        phone: row.profile?.phone ?? null,
        seek_abuse_count: 0,
        tab_hidden_count: 0,
        total: 0,
      })
    }
    const s = map.get(row.user_id)!
    if (row.event_type === 'seek_abuse')  s.seek_abuse_count++
    if (row.event_type === 'tab_hidden')  s.tab_hidden_count++
    s.total++
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 20)
}

export async function getLessonVideoStats(): Promise<LessonVideoStat[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('video_events')
    .select('lesson_id, event_type, lesson:lessons!lesson_id(title)')

  if (!data) return []

  const map = new Map<string, LessonVideoStat>()
  for (const row of data as unknown as { lesson_id: string; event_type: string; lesson: { title: string } | null }[]) {
    if (!map.has(row.lesson_id)) {
      map.set(row.lesson_id, {
        lesson_id: row.lesson_id,
        title: row.lesson?.title ?? row.lesson_id,
        stream_access_count: 0,
        seek_abuse_count: 0,
        tab_hidden_count: 0,
      })
    }
    const s = map.get(row.lesson_id)!
    if (row.event_type === 'stream_access') s.stream_access_count++
    if (row.event_type === 'seek_abuse')    s.seek_abuse_count++
    if (row.event_type === 'tab_hidden')    s.tab_hidden_count++
  }

  return Array.from(map.values()).sort((a, b) => b.stream_access_count - a.stream_access_count).slice(0, 20)
}
