'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/utils'

export async function getCourses(opts?: { category?: string; q?: string }) {
  const supabase = await createClient()
  let query = supabase
    .from('courses')
    .select('*, lessons(count)')
    .eq('is_published', true)

  if (opts?.category) query = query.eq('category', opts.category)
  if (opts?.q)        query = query.ilike('title', `%${opts.q}%`)

  const { data } = await query.order('created_at', { ascending: false })
  return data ?? []
}

export async function getCourseBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, lessons(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .order('order_index', { referencedTable: 'lessons', ascending: true })
    .single()
  return data
}

export async function getAllCoursesAdmin() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, lessons(count)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function upsertCourse(formData: FormData, id?: string) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const payload = {
    title,
    slug: id ? undefined : slugify(title),
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    level: formData.get('level') as string,
    thumbnail_url: formData.get('thumbnail_url') as string || null,
    is_published: formData.get('is_published') === 'true',
  }
  if (id) {
    await supabase.from('courses').update(payload).eq('id', id)
  } else {
    await supabase.from('courses').insert(payload)
  }
  revalidatePath('/admin/courses')
  revalidatePath('/courses')
}

export async function deleteCourse(id: string) {
  const supabase = await createClient()
  await supabase.from('courses').delete().eq('id', id)
  revalidatePath('/admin/courses')
  revalidatePath('/courses')
}

export async function toggleCoursePublished(id: string, current: boolean) {
  const supabase = await createClient()
  await supabase.from('courses').update({ is_published: !current }).eq('id', id)
  revalidatePath('/admin/courses')
  revalidatePath('/courses')
}
