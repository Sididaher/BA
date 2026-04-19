'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getLessonById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lessons')
    .select('*, course:courses(id, title, slug)')
    .eq('id', id)
    .single()
  return data
}

export async function getCourseLessons(courseId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })
  return data ?? []
}

export async function getAllLessonsAdmin() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lessons')
    .select('*, course:courses(id, title, slug)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function upsertLesson(formData: FormData, id?: string) {
  const supabase = await createClient()
  const payload = {
    course_id:       formData.get('course_id') as string,
    title:           formData.get('title') as string,
    description:     (formData.get('description') as string) || null,
    video_url:       (formData.get('video_url') as string)?.trim() || null,
    hls_url:         (formData.get('hls_url') as string)?.trim() || null,
    duration:        parseInt(formData.get('duration') as string) || 0,
    order_index:     parseInt(formData.get('order_index') as string) || 0,
    is_downloadable: formData.get('is_downloadable') === 'true',
    is_protected:    formData.get('is_protected') === 'true',
  }
  if (id) {
    await supabase.from('lessons').update(payload).eq('id', id)
  } else {
    await supabase.from('lessons').insert(payload)
  }
  revalidatePath('/admin/lessons')
}

export async function deleteLesson(id: string) {
  const supabase = await createClient()
  await supabase.from('lessons').delete().eq('id', id)
  revalidatePath('/admin/lessons')
}
