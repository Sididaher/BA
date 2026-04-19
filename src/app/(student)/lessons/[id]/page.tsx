import { getLessonById } from '@/actions/lessons'
import { getProfile } from '@/lib/auth/get-session'
import { canAccessLesson } from '@/lib/auth/access'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDuration } from '@/lib/utils'
import Link from 'next/link'
import VideoPlayer from '@/components/lessons/VideoPlayer'
import LessonActions from '@/components/lessons/LessonActions'
import Badge from '@/components/ui/Badge'
import {
  ClockIcon, ShieldIcon, ChevronLeftIcon, BookOpenIcon, LockIcon,
} from 'lucide-react'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [lesson, profile] = await Promise.all([getLessonById(id), getProfile()])
  if (!lesson || !profile) notFound()

  const canAccess = canAccessLesson(profile, lesson)

  // ── Shared: back button ────────────────────────────────────────────────────
  const backLink = lesson.course ? `/courses/${lesson.course.slug}` : '/courses'

  const BackButton = (
    <div className="flex items-center gap-3 px-5 pt-10 pb-2">
      <Link
        href={backLink}
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
  )

  // ── LOCKED: student has no entitlement for this protected lesson ───────────
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="max-w-md mx-auto">
          {BackButton}

          {/* Lock screen — no video, no actions, no notes */}
          <div className="px-5 pt-2">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                <LockIcon size={26} className="text-muted" />
              </div>
              <p className="text-sm font-semibold text-text text-center px-6">
                Contenu protégé
              </p>
              <p className="text-xs text-muted text-center px-8">
                Cette leçon est réservée aux étudiants inscrits.
                Contactez l&apos;administration pour activer votre accès.
              </p>
            </div>
          </div>

          <div className="px-5 pt-4 space-y-3">
            <h1 className="text-xl font-bold text-text leading-snug">{lesson.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {lesson.duration > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted bg-bg border border-border/60 px-3 py-1.5 rounded-full">
                  <ClockIcon size={11} className="text-primary" />
                  {formatDuration(lesson.duration)}
                </span>
              )}
              <Badge variant="yellow">
                <ShieldIcon size={10} className="mr-1" />Protégé
              </Badge>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── AUTHORIZED: full lesson experience ────────────────────────────────────
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

  const streamUrl = `/api/lesson-stream/${lesson.id}`
  const hasVideo  = !!(lesson.video_url || (lesson.video_bucket && lesson.video_path))

  const rawVideoUrl: string = (() => {
    if (lesson.video_bucket && lesson.video_path) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${lesson.video_bucket}/${lesson.video_path}`
    }
    return lesson.video_url ?? ''
  })()

  const accessTime  = new Date()
  const maskedPhone = profile.phone ? `+222••••${profile.phone.slice(-4)}` : ''
  const watermarkText = [
    profile.full_name ?? 'Étudiant',
    maskedPhone,
    accessTime.toLocaleDateString('fr-FR'),
    accessTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  ].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto">

        {BackButton}

        {/* Video player */}
        <div className="px-5 pt-2">
          {hasVideo ? (
            <VideoPlayer
              streamUrl={streamUrl}
              rawVideoUrl={rawVideoUrl}
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

        {/* Lesson info */}
        <div className="px-5 pt-4 space-y-3">
          <h1 className="text-xl font-bold text-text leading-snug">{lesson.title}</h1>

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

          {lesson.description && (
            <p className="text-sm text-muted leading-relaxed">{lesson.description}</p>
          )}

          <div className="h-px bg-border/50" />

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
