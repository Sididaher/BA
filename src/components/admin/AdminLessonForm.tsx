'use client'
import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { upsertLesson, deleteLesson } from '@/actions/lessons'
import { classifyVideoUrl } from '@/lib/utils'
import { UploadCloudIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'
import type { Lesson, Course } from '@/types'

interface Props {
  lesson?: Lesson
  courses: Pick<Course, 'id' | 'title'>[]
  defaultCourseId?: string
}

// ── XHR upload with progress ─────────────────────────────────────────────────

function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Erreur ${xhr.status}`))
    })
    xhr.addEventListener('error', () => reject(new Error('Erreur réseau')))
    xhr.addEventListener('abort', () => reject(new Error('Upload annulé')))
    xhr.send(file)
  })
}

// ────────────────────────────────────────────────────────────────────────────

export default function AdminLessonForm({ lesson, courses, defaultCourseId }: Props) {
  const router = useRouter()
  const [pending,  startTransition] = useTransition()
  const [deleting, startDelete]     = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine initial video mode based on what the lesson currently has
  const hasStorageVideo = !!(lesson?.video_bucket && lesson?.video_path)
  const [videoMode, setVideoMode] = useState<'storage' | 'url'>(
    hasStorageVideo ? 'storage' : 'url'
  )

  // Storage upload state
  const [selectedFile,    setSelectedFile]    = useState<File | null>(null)
  const [uploadProgress,  setUploadProgress]  = useState(0)
  const [uploadedPath,    setUploadedPath]    = useState<string | null>(lesson?.video_path ?? null)
  const [uploadedBucket,  setUploadedBucket]  = useState<string | null>(lesson?.video_bucket ?? null)
  const [uploading,       setUploading]       = useState(false)
  const [uploadError,     setUploadError]     = useState('')

  // Legacy URL validation
  const [videoUrlError, setVideoUrlError] = useState('')

  function validateVideoUrl(raw: string): string {
    const url = raw.trim()
    if (!url) return ''
    const type = classifyVideoUrl(url)
    if (type === 'invalid') {
      return 'URL non prise en charge. Utilisez YouTube, Vimeo, ou un lien direct .mp4/.webm.'
    }
    return ''
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setUploadError('')
    setUploadProgress(0)
  }

  function switchMode(mode: 'storage' | 'url') {
    setVideoMode(mode)
    setUploadError('')
    setVideoUrlError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    // ── Storage mode: upload file first, then save ────────────────────────
    if (videoMode === 'storage') {
      if (selectedFile) {
        setUploading(true)
        setUploadError('')
        setUploadProgress(0)
        try {
          const ext = selectedFile.name.split('.').pop() ?? 'mp4'
          const res = await fetch('/api/admin/upload-url', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ ext, contentType: selectedFile.type }),
          })
          if (!res.ok) {
            const { error } = await res.json()
            throw new Error(error ?? 'Erreur serveur')
          }
          const { path, bucket, signedUrl } = await res.json()
          await uploadWithProgress(signedUrl, selectedFile, setUploadProgress)
          setUploadedPath(path)
          setUploadedBucket(bucket)
          fd.set('video_bucket', bucket)
          fd.set('video_path',   path)
          fd.set('video_type',   'storage')
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : 'Upload échoué')
          setUploading(false)
          return
        }
        setUploading(false)
      } else if (uploadedPath && uploadedBucket) {
        // Re-saving without changing the file — keep existing storage data
        fd.set('video_bucket', uploadedBucket)
        fd.set('video_path',   uploadedPath)
        fd.set('video_type',   'storage')
      }
      // Clear legacy URL when using storage
      fd.delete('video_url')
    } else {
      // ── URL mode: validate, clear storage fields ────────────────────────
      const err = validateVideoUrl(fd.get('video_url') as string ?? '')
      if (err) { setVideoUrlError(err); return }
      setVideoUrlError('')
      fd.delete('video_bucket')
      fd.delete('video_path')
      fd.delete('video_type')
    }

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

  const isSubmitting = pending || uploading

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Course */}
      <div>
        <label className={label}>Cours *</label>
        <select name="course_id" required defaultValue={lesson?.course_id ?? defaultCourseId ?? ''} className={field}>
          <option value="">— Choisir un cours —</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className={label}>Titre *</label>
        <input name="title" required defaultValue={lesson?.title} placeholder="Titre de la leçon" className={field} />
      </div>

      {/* Description */}
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

      {/* ── Video source ────────────────────────────────────────────────────── */}
      <div>
        <label className={label}>Source vidéo</label>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-admin-border overflow-hidden mb-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchMode('storage')}
            className={`flex-1 py-2.5 transition-colors ${
              videoMode === 'storage'
                ? 'bg-primary text-white'
                : 'bg-admin-bg text-slate-400 hover:text-white'
            }`}
          >
            Fichier (stockage privé)
          </button>
          <button
            type="button"
            onClick={() => switchMode('url')}
            className={`flex-1 py-2.5 transition-colors border-l border-admin-border ${
              videoMode === 'url'
                ? 'bg-primary text-white'
                : 'bg-admin-bg text-slate-400 hover:text-white'
            }`}
          >
            URL externe
          </button>
        </div>

        {/* ── Storage upload panel ──────────────────────────────────────── */}
        {videoMode === 'storage' && (
          <div className="space-y-2">
            {/* Existing storage file indicator */}
            {uploadedPath && !selectedFile && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircleIcon size={14} className="text-green-400 shrink-0" />
                <span className="text-xs text-green-400 truncate flex-1">{uploadedPath}</span>
                <button
                  type="button"
                  onClick={() => { setUploadedPath(null); setUploadedBucket(null) }}
                  className="text-slate-500 hover:text-slate-300 shrink-0"
                >
                  <XCircleIcon size={14} />
                </button>
              </div>
            )}

            {/* File drop zone */}
            <label
              className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-primary bg-primary/5'
                  : 'border-admin-border bg-admin-bg hover:border-primary/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogv,.mov"
                onChange={handleFileSelect}
                className="sr-only"
              />
              <UploadCloudIcon size={24} className={selectedFile ? 'text-primary' : 'text-slate-500'} />
              {selectedFile ? (
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} Mo</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-300">Cliquez pour sélectionner un fichier</p>
                  <p className="text-xs text-slate-500 mt-0.5">MP4, WebM, OGG, MOV — max 500 Mo</p>
                </div>
              )}
            </label>

            {/* Upload progress bar */}
            {uploading && (
              <div>
                <div className="h-1.5 bg-admin-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Envoi en cours… {uploadProgress}%</p>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <XCircleIcon size={12} /> {uploadError}
              </p>
            )}

            <p className="text-xs text-slate-500">
              Le fichier est stocké de façon privée. Les étudiants reçoivent un lien signé temporaire (5 min).
            </p>
          </div>
        )}

        {/* ── Legacy URL panel ─────────────────────────────────────────── */}
        {videoMode === 'url' && (
          <div>
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
                Formats acceptés : YouTube, Vimeo, Supabase Storage ou lien direct .mp4/.webm.
                Les URLs YouTube/Vimeo sont publiques et ne peuvent pas être entièrement protégées.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Duration + order */}
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

      {/* Flags */}
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

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {uploading ? `Envoi… ${uploadProgress}%` : pending ? 'Enregistrement…' : lesson ? 'Mettre à jour' : 'Créer la leçon'}
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
