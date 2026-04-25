import { getStudentCourseDetail } from '@/actions/courses'
import { getProfile } from '@/lib/auth/get-session'
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
  const profile = await getProfile()
  if (!profile) notFound()

  const detail = await getStudentCourseDetail(profile.id, slug)
  if (!detail || !detail.course) notFound()

  const { course, lessons: dbLessons, is_favorited } = detail as any
  const lessons = dbLessons as any[]
  const isFavorited = is_favorited

  const completedCount = lessons.filter(l => l.is_completed).length
  const progress = lessons.length > 0
    ? Math.round((completedCount / lessons.length) * 100)
    : 0

  const entitledLessonIds = lessons
    .filter(l => l.has_access)
    .map(l => l.id)

  return (
    <div>
      <PageHeader title="" back />
      <CourseDetailView
        course={course}
        lessons={lessons}
        isFavorited={isFavorited}
        progress={progress}
        completedCount={completedCount}
        userProgress={lessons.map(l => ({ lesson_id: l.id, completed: l.is_completed })) as any}
        profileRole={profile.role}
        entitledLessonIds={entitledLessonIds}
      />
    </div>
  )
}
