import { getLessonById } from '@/actions/lessons'
import { getProfile } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDuration } from '@/lib/utils'
import Link from 'next/link'
import VideoPlayer from '@/components/lessons/VideoPlayer'
import LessonActions from '@/components/lessons/LessonActions'
import Badge from '@/components/ui/Badge'
import {
  ClockIcon, ShieldIcon, ChevronLeftIcon, BookOpenIcon,
} from 'lucide-react'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [lesson, profile] = await Promise.all([getLessonById(id), getProfile()])
  if (!lesson || !profile) notFound()

  const supabase = await createClient()
  const [{ data: progress }, { data: note }] = await Promise.all([
    supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', profile.id)
      .eq('lesson_id', id)
      .single(),
    supabase
      .from('notes')
      .select('*')
      .eq('user_id', profile.id)
      .eq('lesson_id', id)
      .maybeSingle(),
  ])

  const streamUrl  = `/api/lesson-stream/${lesson.id}`
  const hasVideo   = !!lesson.video_url || !!lesson.hls_url

  // Watermark: name · masked phone · date · time · session fingerprint
  // Built server-side — fingerprint is hash(user_id + date) so each day is unique
  // and forensically traceable without exposing the real session token.
  const accessTime  = new Date()
  const maskedPhone = profile.phone
    ? `+222••••${profile.phone.slice(-4)}`
    : ''

  const fingerprintRaw = new TextEncoder().encode(
    profile.id + accessTime.toISOString().slice(0, 10)
  )
  const fingerprintBuf = await crypto.subtle.digest('SHA-256', fingerprintRaw)
  const sessionHint = Array.from(new Uint8Array(fingerprintBuf))
    .slice(0, 3)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const watermarkText = [
    profile.full_name ?? 'Étudiant',
    maskedPhone,
    accessTime.toLocaleDateString('fr-FR'),
    accessTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    `#${sessionHint}`,
  ].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto">

        {/* ── Floating back button ─────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 pt-10 pb-2">
          <Link
            href={lesson.course ? `/courses/${lesson.course.slug}` : '/courses'}
            className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center active:scale-90 transition-transform shadow-sm"
            aria-label="Retour"
          >
            <ChevronLeftIcon size={20} className="text-text" />
          </Link>
          {lesson.course && (
            <p className="text-xs font-semibold text-primary truncate flex-1">
              {lesson.course.title}
            </p>
          )}
        </div>

        {/* ── Video player ─────────────────────────────────────── */}
        <div className="px-5 pt-2">
          {hasVideo ? (
            <VideoPlayer
              streamUrl={streamUrl}
              rawVideoUrl={lesson.video_url!}
              lessonId={lesson.id}
              isProtected={lesson.is_protected}
              watermarkText={watermarkText}
            />
          ) : (
            <div className="aspect-video bg-gradient-to-br from-primary-light to-blue-100 rounded-2xl flex flex-col items-center justify-center gap-2">
              <BookOpenIcon size={32} className="text-primary/40" />
              <p className="text-muted text-sm">Vidéo non disponible</p>
            </div>
          )}
        </div>

        {/* ── Lesson info ──────────────────────────────────────── */}
        <div className="px-5 pt-4 space-y-3">
          <h1 className="text-xl font-bold text-text leading-snug">
            {lesson.title}
          </h1>

          {/* Meta chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {lesson.duration > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted bg-bg border border-border/60 px-3 py-1.5 rounded-full">
                <ClockIcon size={11} className="text-primary" />
                {formatDuration(lesson.duration)}
              </span>
            )}
            {lesson.is_protected && (
              <Badge variant="yellow">
                <ShieldIcon size={10} className="mr-1" />Protégé
              </Badge>
            )}
            {lesson.is_downloadable && (
              <Badge variant="green">Téléchargeable</Badge>
            )}
          </div>

          {/* Description */}
          {lesson.description && (
            <p className="text-sm text-muted leading-relaxed">{lesson.description}</p>
          )}

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Actions: mark done + notes + ask teacher */}
          <LessonActions
            lessonId={lesson.id}
            isCompleted={progress?.completed ?? false}
            existingNote={note}
            lessonTitle={lesson.title}
          />
        </div>

      </div>
    </div>
  )
}
