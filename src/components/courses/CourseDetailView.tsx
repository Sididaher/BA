'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ClockIcon, StarIcon, BookOpenIcon, PlayCircleIcon, CheckCircle2Icon, ArrowRightIcon } from 'lucide-react'
import { formatDuration, cn } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import LessonListItem from '@/components/lessons/LessonListItem'
import FavoriteButton from '@/components/courses/FavoriteButton'
import type { Course, Lesson, UserProgress } from '@/types'

interface Props {
  course: Course
  lessons: Lesson[]
  isFavorited: boolean
  progress: number
  completedCount: number
  userProgress: UserProgress[]
  isActiveStudent: boolean
}

type Tab = 'lessons' | 'about'

export default function CourseDetailView({
  course, lessons, isFavorited, progress, completedCount, userProgress, isActiveStudent,
}: Props) {
  const [tab, setTab] = useState<Tab>('lessons')

  // Sticky CTA targets the first accessible incomplete lesson
  const firstAccessibleIncomplete = lessons.find(l => {
    const done      = userProgress.find(p => p.lesson_id === l.id && p.completed)
    const canAccess = !l.is_protected || isActiveStudent
    return !done && canAccess
  })
  const ctaHref  = progress === 100 ? '#' : firstAccessibleIncomplete ? `/lessons/${firstAccessibleIncomplete.id}` : lessons[0] ? `/lessons/${lessons[0].id}` : '#'
  const ctaLabel = progress === 100 ? 'Cours terminé' : progress > 0 ? 'Continuer' : 'Commencer le cours'
  const ctaDone  = progress === 100

  return (
    <div className="min-h-screen bg-bg pb-28">

      {/* ── Hero image ──────────────────────────────────────────── */}
      <div className="relative">
        <div className="relative h-56 bg-gradient-to-br from-primary-light to-blue-100">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpenIcon size={72} className="text-primary/25" />
            </div>
          )}
          {/* dark scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Floating action bar (back handled by PageHeader above this component) */}
        <div className="absolute top-4 right-4">
          <FavoriteButton courseId={course.id} isFavorited={isFavorited} />
        </div>

        {/* Play overlay */}
        {course.thumbnail_url && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <PlayCircleIcon size={32} className="text-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* ── Info card ───────────────────────────────────────────── */}
      <div className="px-5 pt-5 space-y-4">

        {/* Category + title */}
        {course.category && <Badge variant="blue">{course.category}</Badge>}
        <h1 className="text-2xl font-bold text-text leading-tight">{course.title}</h1>

        {/* Meta chips row */}
        <div className="flex items-center gap-2 flex-wrap">
          {course.total_duration > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted bg-bg border border-border/60 px-3 py-1.5 rounded-full">
              <ClockIcon size={12} className="text-primary" />
              {formatDuration(course.total_duration)}
            </span>
          )}
          {lessons.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted bg-bg border border-border/60 px-3 py-1.5 rounded-full">
              <BookOpenIcon size={12} className="text-primary" />
              {lessons.length} leçon{lessons.length !== 1 ? 's' : ''}
            </span>
          )}
          {course.rating > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted bg-bg border border-border/60 px-3 py-1.5 rounded-full">
              <StarIcon size={12} className="fill-yellow-400 text-yellow-400" />
              {course.rating}
            </span>
          )}
          {course.level && (
            <Badge variant="gray">{course.level}</Badge>
          )}
        </div>

        {/* Progress bar (if started) */}
        {completedCount > 0 && (
          <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-text">Progression</span>
              <span className="text-primary font-bold">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
            <p className="text-xs text-muted">{completedCount}/{lessons.length} leçons complétées</p>
          </div>
        )}

        {/* ── Tab switcher ─────────────────────────────────────── */}
        <div className="flex bg-bg border border-border/60 rounded-2xl p-1 gap-1">
          {([
            { key: 'lessons', label: `Leçons (${lessons.length})` },
            { key: 'about',   label: 'À propos' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
                tab === key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ─────────────────────────────────────── */}
        {tab === 'lessons' ? (
          <div className="space-y-2 pb-4">
            {lessons.length === 0 ? (
              <p className="text-center text-muted text-sm py-8">Aucune leçon disponible.</p>
            ) : (
              lessons.map((lesson, i) => {
                const done      = userProgress.find(p => p.lesson_id === lesson.id && p.completed)
                // canAccess: protected lessons require an active (paid) account
                const canAccess = !lesson.is_protected || isActiveStudent
                return (
                  <LessonListItem
                    key={lesson.id}
                    lesson={lesson}
                    index={i + 1}
                    completed={!!done}
                    canAccess={canAccess}
                  />
                )
              })
            )}
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {course.description ? (
              <p className="text-sm text-muted leading-relaxed">{course.description}</p>
            ) : (
              <p className="text-sm text-muted text-center py-8">Aucune description disponible.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky CTA ──────────────────────────────────────────── */}
      <div className="fixed bottom-20 left-0 right-0 px-5 z-30 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          {ctaDone ? (
            <div className="w-full py-4 rounded-2xl bg-green-50 border border-green-200 text-success font-bold text-sm flex items-center justify-center gap-2">
              <CheckCircle2Icon size={16} /> Cours terminé
            </div>
          ) : (
            <Link
              href={ctaHref}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              {ctaLabel} <ArrowRightIcon size={16} />
            </Link>
          )}
        </div>
      </div>

    </div>
  )
}
