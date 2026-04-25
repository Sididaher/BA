import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import DownloadsView from '@/components/downloads/DownloadsView'
import type { Lesson, Course } from '@/types'

type DownloadLesson = Lesson & { course?: Pick<Course, 'id' | 'title' | 'slug'> }

export default async function DownloadsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*, course:courses(id, title, slug)')
    .eq('is_downloadable', true)
    .order('created_at', { ascending: false })

  return <DownloadsView items={(lessons ?? []) as DownloadLesson[]} />
}
