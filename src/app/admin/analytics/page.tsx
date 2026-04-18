import { requireAdmin } from '@/lib/auth/get-session'
import { getAdminOverview } from '@/actions/analytics'
import { createClient } from '@/lib/supabase/server'
import { UsersIcon, BookOpenIcon, VideoIcon, CheckSquareIcon, StarIcon } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

export default async function AdminAnalyticsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [overview, topCoursesByProgress, activeStudents] = await Promise.all([
    getAdminOverview(),
    supabase
      .from('user_progress')
      .select('lesson:lessons(course_id, course:courses(id, title))')
      .eq('completed', true)
      .limit(200),
    supabase
      .from('user_progress')
      .select('user_id')
      .limit(200),
  ])

  // Aggregate completions per course
  const courseCompletions: Record<string, { title: string; count: number }> = {}
  for (const row of topCoursesByProgress.data ?? []) {
    const lesson = (row as any).lesson
    const course = lesson?.course
    if (!course) continue
    if (!courseCompletions[course.id]) courseCompletions[course.id] = { title: course.title, count: 0 }
    courseCompletions[course.id].count++
  }
  const sortedCourses = Object.values(courseCompletions).sort((a, b) => b.count - a.count).slice(0, 5)

  // Unique active students
  const uniqueStudents = new Set((activeStudents.data ?? []).map((r: any) => r.user_id)).size

  const completionRate = overview.totalLessons > 0
    ? Math.round((overview.completedLessons / (overview.totalLessons * Math.max(overview.totalStudents, 1))) * 100)
    : 0

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytiques</h1>
        <p className="text-slate-400 text-sm mt-1">Statistiques d&apos;utilisation de la plateforme</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Étudiants inscrits', value: overview.totalStudents, icon: UsersIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Cours publiés', value: overview.totalCourses, icon: BookOpenIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Leçons créées', value: overview.totalLessons, icon: VideoIcon, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Étudiants actifs', value: uniqueStudents, icon: StarIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-admin-surface rounded-2xl border border-admin-border p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Completion rate */}
      <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
        <h2 className="text-base font-bold text-white mb-4">Taux de complétion global</h2>
        <div className="flex items-end gap-4">
          <p className="text-5xl font-bold text-primary">{completionRate}%</p>
          <p className="text-slate-400 text-sm mb-1 leading-relaxed">
            {overview.completedLessons} leçons terminées<br />
            sur {overview.totalLessons} × {overview.totalStudents} étudiants potentiels
          </p>
        </div>
        <div className="mt-4 h-3 bg-admin-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Top courses */}
      <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
        <h2 className="text-base font-bold text-white mb-4">Cours les plus suivis</h2>
        {sortedCourses.length === 0 ? (
          <p className="text-slate-400 text-sm">Pas encore de données de progression.</p>
        ) : (
          <div className="space-y-3">
            {sortedCourses.map((course, i) => (
              <div key={course.title} className="flex items-center gap-4">
                <span className="text-slate-500 text-sm font-bold w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{course.title}</p>
                </div>
                <span className="text-sm font-bold text-primary shrink-0">{course.count} compl.</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <CheckSquareIcon size={16} className="text-green-400" />
          <h2 className="text-base font-bold text-white">Total leçons complétées</h2>
        </div>
        <p className="text-4xl font-bold text-white mt-3">{overview.completedLessons}</p>
        <p className="text-slate-400 text-sm mt-1">à travers tous les étudiants et cours</p>
      </div>
    </div>
  )
}
