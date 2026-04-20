import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { getStudentEntitlementIds } from '@/actions/access'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AccessToggleButton from '@/components/admin/AccessToggleButton'
import { ChevronLeftIcon, ShieldIcon, BookOpenIcon, LockIcon } from 'lucide-react'
import { formatPhone } from '@/lib/utils'

export default async function StudentAccessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id: studentId } = await params

  const supabase = await createClient()

  // Fetch student profile
  const { data: student } = await supabase
    .from('profiles')
    .select('id, full_name, phone, is_active')
    .eq('id', studentId)
    .eq('role', 'student')
    .single()

  if (!student) notFound()

  // Fetch all courses with their protected lessons
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, lessons(id, title, order_index, is_protected)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const allCourses = (courses ?? []) as Array<{
    id: string
    title: string
    lessons: Array<{ id: string; title: string; order_index: number; is_protected: boolean }>
  }>

  // Only show courses that have at least one protected lesson
  const coursesWithProtected = allCourses
    .map(c => ({
      ...c,
      lessons: (c.lessons ?? [])
        .filter(l => l.is_protected)
        .sort((a, b) => a.order_index - b.order_index),
    }))
    .filter(c => c.lessons.length > 0)

  // Fetch existing entitlements
  const entitledIds = await getStudentEntitlementIds(studentId)

  const totalProtected = coursesWithProtected.reduce((s, c) => s + c.lessons.length, 0)
  const totalGranted   = coursesWithProtected.reduce(
    (s, c) => s + c.lessons.filter(l => entitledIds.has(l.id)).length,
    0,
  )

  return (
    <div className="p-4 md:p-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/students"
          className="w-8 h-8 rounded-lg bg-admin-surface border border-admin-border flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronLeftIcon size={16} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Accès aux leçons</h1>
          <p className="text-slate-400 text-sm">
            {student.full_name ?? 'Sans nom'}
            {student.phone ? ` · ${formatPhone(student.phone)}` : ''}
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl p-4 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <ShieldIcon size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">
            {totalGranted} / {totalProtected} leçons protégées débloquées
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            Leçons non-protégées accessibles à tous les étudiants actifs.
          </p>
        </div>
      </div>

      {coursesWithProtected.length === 0 ? (
        <div className="bg-admin-surface border border-admin-border rounded-2xl py-16 text-center">
          <LockIcon size={28} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Aucune leçon protégée dans les cours publiés.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coursesWithProtected.map(course => (
            <div key={course.id} className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-admin-border flex items-center gap-2">
                <BookOpenIcon size={14} className="text-primary" />
                <p className="text-sm font-semibold text-white">{course.title}</p>
                <span className="ml-auto text-xs text-slate-500">
                  {course.lessons.filter(l => entitledIds.has(l.id)).length}/{course.lessons.length}
                </span>
              </div>
              <div className="divide-y divide-admin-border">
                {course.lessons.map(lesson => (
                  <div key={lesson.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-300 min-w-0 truncate">
                      <span className="text-slate-500 mr-2">{lesson.order_index}.</span>
                      {lesson.title}
                    </p>
                    <AccessToggleButton
                      studentId={studentId}
                      lessonId={lesson.id}
                      hasAccess={entitledIds.has(lesson.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
