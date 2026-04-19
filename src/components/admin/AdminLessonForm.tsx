'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertLesson, deleteLesson } from '@/actions/lessons'
import { classifyVideoUrl } from '@/lib/utils'
import type { Lesson, Course } from '@/types'

interface Props {
  lesson?: Lesson
  courses: Pick<Course, 'id' | 'title'>[]
  defaultCourseId?: string
}

export default function AdminLessonForm({ lesson, courses, defaultCourseId }: Props) {
  const router = useRouter()
  const [pending,  startTransition] = useTransition()
  const [deleting, startDelete]     = useTransition()
  const [videoUrlError, setVideoUrlError] = useState('')

  function validateVideoUrl(raw: string): string {
    const url = raw.trim()
    if (!url) return ''
    const type = classifyVideoUrl(url)
    if (type === 'invalid') {
      return 'URL non prise en charge. Utilisez un lien YouTube, Vimeo, ou une URL directe vers un fichier vidéo (.mp4, .webm…).'
    }
    return ''
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd  = new FormData(e.currentTarget)
    const err = validateVideoUrl(fd.get('video_url') as string ?? '')
    if (err) { setVideoUrlError(err); return }
    setVideoUrlError('')
    startTransition(async () => {
      await upsertLesson(fd, lesson?.id)
      router.push('/admin/lessons')
    })
  }

  function handleDelete() {
    if (!lesson || !confirm('Supprimer cette leçon ?')) return
    startDelete(async () => {
      await deleteLesson(lesson.id)
      router.push('/admin/lessons')
    })
  }

  const field = 'w-full rounded-xl border border-admin-border bg-admin-bg text-white px-4 py-3 text-sm placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
  const label = 'block text-xs font-semibold text-slate-400 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={label}>Cours *</label>
        <select name="course_id" required defaultValue={lesson?.course_id ?? defaultCourseId ?? ''} className={field}>
          <option value="">— Choisir un cours —</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div>
        <label className={label}>Titre *</label>
        <input name="title" required defaultValue={lesson?.title} placeholder="Titre de la leçon" className={field} />
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea
          name="description"
          defaultValue={lesson?.description ?? ''}
          placeholder="Description..."
          rows={3}
          className={field + ' resize-none'}
        />
      </div>

      <div>
        <label className={label}>URL Vidéo</label>
        <input
          name="video_url"
          defaultValue={lesson?.video_url ?? ''}
          placeholder="YouTube, Vimeo, ou lien direct .mp4/.webm"
          className={field + (videoUrlError ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : '')}
          onChange={() => videoUrlError && setVideoUrlError('')}
        />
        {videoUrlError ? (
          <p className="mt-1.5 text-xs text-red-400">{videoUrlError}</p>
        ) : (
          <p className="mt-1.5 text-xs text-slate-500">
            Formats acceptés : YouTube (youtube.com/watch?v=… ou youtu.be/…), Vimeo,
            Supabase Storage, ou lien direct vers un fichier .mp4 / .webm
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Durée (secondes)</label>
          <input name="duration" type="number" min="0" defaultValue={lesson?.duration ?? 0} className={field} />
        </div>
        <div>
          <label className={label}>Ordre</label>
          <input name="order_index" type="number" min="0" defaultValue={lesson?.order_index ?? 0} className={field} />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_protected"
            value="true"
            defaultChecked={lesson?.is_protected ?? true}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm text-slate-300">Protégé</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_downloadable"
            value="true"
            defaultChecked={lesson?.is_downloadable}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm text-slate-300">Téléchargeable</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {pending ? 'Enregistrement…' : lesson ? 'Mettre à jour' : 'Créer la leçon'}
        </button>
        {lesson && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {deleting ? '…' : 'Supprimer'}
          </button>
        )}
      </div>
    </form>
  )
}
