import { getCourseBySlug } from '@/actions/courses'
import { getProfile } from '@/lib/auth/get-session'
import { getUserProgress } from '@/actions/progress'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import CourseDetailView from '@/components/courses/CourseDetailView'
import { createClient } from '@/lib/supabase/server'
import type { Lesson } from '@/types'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [course, profile] = await Promise.all([getCourseBySlug(slug), getProfile()])
  if (!course || !profile) notFound()

  const userProgress = await getUserProgress(profile.id)
  const lessons      = (course.lessons ?? []) as Lesson[]
  const completedCount = lessons.filter(
    l => userProgress.find(p => p.lesson_id === l.id && p.completed),
  ).length
  const progress = lessons.length > 0
    ? Math.round((completedCount / lessons.length) * 100)
    : 0

  const supabase = await createClient()
  const { data: fav } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', profile.id)
    .eq('course_id', course.id)
    .single()
  const isFavorited = !!fav

  return (
    <div>
      {/* Transparent back button header overlaying the hero */}
      <PageHeader title="" back />
      <CourseDetailView
        course={course}
        lessons={lessons}
        isFavorited={isFavorited}
        progress={progress}
        completedCount={completedCount}
        userProgress={userProgress}
      />
    </div>
  )
}
