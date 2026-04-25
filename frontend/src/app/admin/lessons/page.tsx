import { getAllLessonsAdmin } from '@/actions/lessons'
import { getAllCoursesAdmin } from '@/actions/courses'
import { requireAdmin } from '@/lib/auth/get-session'
import { PlusIcon, ShieldIcon, DownloadIcon } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import AdminLessonForm from '@/components/admin/AdminLessonForm'
import Link from 'next/link'

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; id?: string; course_id?: string }>
}) {
  await requireAdmin()
  const { action, id, course_id } = await searchParams

  const [lessons, courses] = await Promise.all([
    getAllLessonsAdmin(),
    getAllCoursesAdmin(),
  ])

  const editingLesson = action === 'edit' && id ? lessons.find(l => l.id === id) : undefined
  const showForm = action === 'new' || action === 'edit'

  const coursesForForm = courses.map(c => ({ id: c.id, title: c.title }))

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leçons</h1>
          <p className="text-slate-400 text-sm mt-1">{lessons.length} leçons au total</p>
        </div>
        <Link
          href="/admin/lessons?action=new"
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <PlusIcon size={16} />
          Nouvelle leçon
        </Link>
      </div>

      {showForm && (
        <div className="bg-admin-surface rounded-2xl border border-admin-border p-6 mb-6 max-w-2xl">
          <h2 className="text-base font-bold text-white mb-4">
            {editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon'}
          </h2>
          <AdminLessonForm lesson={editingLesson} courses={coursesForForm} defaultCourseId={course_id} />
        </div>
      )}

      <div className="bg-admin-surface rounded-2xl border border-admin-border overflow-hidden overflow-x-auto">
        {lessons.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Aucune leçon créée.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Titre</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Cours</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Durée</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Options</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {lessons.map(lesson => (
                <tr key={lesson.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white line-clamp-1">{lesson.title}</p>
                    <p className="text-xs text-slate-400 md:hidden">{lesson.course?.title}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-300 hidden md:table-cell">{lesson.course?.title ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-300 hidden lg:table-cell">{formatDuration(lesson.duration)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      {lesson.is_protected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full text-xs">
                          <ShieldIcon size={10} />Protégé
                        </span>
                      )}
                      {lesson.is_downloadable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs">
                          <DownloadIcon size={10} />DL
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/lessons?action=edit&id=${lesson.id}`}
                      className="text-xs font-semibold px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
