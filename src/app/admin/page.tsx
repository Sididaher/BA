import { getAdminOverview, getRecentStudents, getTopCourses } from '@/actions/analytics'
import { requireAdmin } from '@/lib/auth/get-session'
import { UsersIcon, BookOpenIcon, VideoIcon, CheckSquareIcon, BellIcon } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

export default async function AdminDashboard() {
  await requireAdmin()
  const [overview, recentStudents, topCourses] = await Promise.all([
    getAdminOverview(),
    getRecentStudents(),
    getTopCourses(),
  ])

  const STATS = [
    { label: 'Étudiants', value: overview.totalStudents, icon: UsersIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Cours', value: overview.totalCourses, icon: BookOpenIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Leçons', value: overview.totalLessons, icon: VideoIcon, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Complétions', value: overview.completedLessons, icon: CheckSquareIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Notifications', value: overview.totalNotifications, icon: BellIcon, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-slate-400 text-sm mt-1">Vue d&apos;ensemble de la plateforme</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-admin-surface rounded-2xl border border-admin-border p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent students */}
        <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
          <h2 className="text-base font-bold text-white mb-4">Derniers inscrits</h2>
          {recentStudents.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucun étudiant inscrit</p>
          ) : (
            <div className="space-y-3">
              {recentStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {(s.full_name ?? s.phone ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.full_name ?? 'Sans nom'}</p>
                    <p className="text-xs text-slate-400">{s.phone}</p>
                  </div>
                  <p className="text-xs text-slate-500 shrink-0">{timeAgo(s.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top courses */}
        <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
          <h2 className="text-base font-bold text-white mb-4">Cours publiés</h2>
          {topCourses.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucun cours publié</p>
          ) : (
            <div className="space-y-3">
              {topCourses.map(course => (
                <div key={course.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                    <BookOpenIcon size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{course.title}</p>
                    <p className="text-xs text-slate-400">{course.category} · {course.level}</p>
                  </div>
                  <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full shrink-0">Publié</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
