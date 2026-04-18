import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AdminCourseForm from '@/components/admin/AdminCourseForm'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()
  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single()
  if (!course) notFound()

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/courses" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ArrowLeftIcon size={20} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Modifier le cours</h1>
          <p className="text-slate-400 text-sm mt-0.5 truncate">{course.title}</p>
        </div>
      </div>
      <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
        <AdminCourseForm course={course} />
      </div>
    </div>
  )
}
