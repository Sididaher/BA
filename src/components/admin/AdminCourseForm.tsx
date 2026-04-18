'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertCourse, deleteCourse } from '@/actions/courses'
import { COURSE_CATEGORIES, COURSE_LEVELS } from '@/constants'
import type { Course } from '@/types'

interface Props {
  course?: Course
}

export default function AdminCourseForm({ course }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await upsertCourse(fd, course?.id)
      router.push('/admin/courses')
    })
  }

  function handleDelete() {
    if (!course || !confirm('Supprimer ce cours ?')) return
    startDelete(async () => {
      await deleteCourse(course.id)
      router.push('/admin/courses')
    })
  }

  const field = 'w-full rounded-xl border border-admin-border bg-admin-bg text-white px-4 py-3 text-sm placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
  const label = 'block text-xs font-semibold text-slate-400 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={label}>Titre *</label>
        <input name="title" required defaultValue={course?.title} placeholder="Titre du cours" className={field} />
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea
          name="description"
          defaultValue={course?.description ?? ''}
          placeholder="Description du cours..."
          rows={3}
          className={field + ' resize-none'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Catégorie</label>
          <select name="category" defaultValue={course?.category ?? ''} className={field}>
            <option value="">— Choisir —</option>
            {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Niveau</label>
          <select name="level" defaultValue={course?.level ?? ''} className={field}>
            <option value="">— Choisir —</option>
            {COURSE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>URL Miniature</label>
        <input name="thumbnail_url" defaultValue={course?.thumbnail_url ?? ''} placeholder="https://..." className={field} />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="is_published"
          id="is_published"
          value="true"
          defaultChecked={course?.is_published}
          className="w-4 h-4 rounded accent-primary"
        />
        <label htmlFor="is_published" className="text-sm text-slate-300">Publier le cours</label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {pending ? 'Enregistrement…' : course ? 'Mettre à jour' : 'Créer le cours'}
        </button>
        {course && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {deleting ? '…' : 'Supprimer'}
          </button>
        )}
      </div>
    </form>
  )
}
