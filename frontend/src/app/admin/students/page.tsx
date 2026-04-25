import { getAllStudents } from '@/actions/students'
import { requireAdmin } from '@/lib/auth/get-session'
import { timeAgo, formatPhone } from '@/lib/utils'
import ToggleStudentButton from '@/components/admin/ToggleStudentButton'
import Link from 'next/link'
import { ShieldIcon } from 'lucide-react'

export default async function AdminStudentsPage() {
  await requireAdmin()
  const students = await getAllStudents()

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Étudiants</h1>
        <p className="text-slate-400 text-sm mt-1">{students.length} étudiant{students.length !== 1 ? 's' : ''} inscrits</p>
      </div>

      <div className="bg-admin-surface rounded-2xl border border-admin-border overflow-hidden overflow-x-auto">
        {students.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Aucun étudiant inscrit pour le moment.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Étudiant</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Téléphone</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Inscrit</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Accès</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {(student.full_name ?? student.phone ?? '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{student.full_name ?? 'Sans nom'}</p>
                        <p className="text-xs text-slate-400 md:hidden">{formatPhone(student.phone ?? '')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 hidden md:table-cell">{formatPhone(student.phone ?? '')}</td>
                  <td className="px-6 py-4 text-slate-400 hidden lg:table-cell">{timeAgo(student.created_at)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${student.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {student.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/students/${student.id}/access`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <ShieldIcon size={12} /> Gérer
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <ToggleStudentButton id={student.id} isActive={student.is_active} />
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
