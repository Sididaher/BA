import { getAllCoursesAdmin } from '@/actions/courses'
import { requireAdmin } from '@/lib/auth/get-session'
import { PlusIcon, BookOpenIcon } from 'lucide-react'
import Link from 'next/link'
import ToggleCourseButton from '@/components/admin/ToggleCourseButton'

export default async function AdminCoursesPage() {
  await requireAdmin()
  const courses = await getAllCoursesAdmin()

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cours</h1>
          <p className="text-slate-400 text-sm mt-1">{courses.length} cours au total</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <PlusIcon size={16} />
          Nouveau cours
        </Link>
      </div>

      <div className="bg-admin-surface rounded-2xl border border-admin-border overflow-hidden overflow-x-auto">
        {courses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Aucun cours créé pour le moment.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cours</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Catégorie</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Niveau</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                        {course.thumbnail_url
                          ? <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover rounded-xl" />
                          : <BookOpenIcon size={16} className="text-primary" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-white line-clamp-1">{course.title}</p>
                        <p className="text-xs text-slate-400">{(course as any).lessons?.[0]?.count ?? 0} leçons</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 hidden md:table-cell">{course.category ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-300 hidden lg:table-cell">{course.level ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${course.is_published ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {course.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <ToggleCourseButton id={course.id} isPublished={course.is_published} />
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="text-xs font-semibold px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                      >
                        Modifier
                      </Link>
                    </div>
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
