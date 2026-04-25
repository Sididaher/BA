import Link from 'next/link'
import {
  CheckCircle2Icon, LockIcon, PlayCircleIcon,
  ClockIcon, DownloadIcon, ChevronRightIcon,
} from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { Lesson } from '@/types'

interface LessonListItemProps {
  lesson: Lesson
  index: number
  completed?: boolean
  canAccess?: boolean
}

export default function LessonListItem({ lesson, index, completed, canAccess = true }: LessonListItemProps) {
  const isLocked = !canAccess

  const card = (
    <div className={[
      'flex items-center gap-3 bg-card rounded-2xl border border-border/40 shadow-sm p-4 transition-all',
      isLocked
        ? 'opacity-70 cursor-not-allowed select-none'
        : 'active:scale-[0.98] hover:shadow-md cursor-pointer',
    ].join(' ')}>

      {/* State icon in bubble */}
      <div className={[
        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
        completed ? 'bg-green-50' :
        isLocked  ? 'bg-gray-100' :
        'bg-primary-light',
      ].join(' ')}>
        {completed ? (
          <CheckCircle2Icon size={20} className="text-success" />
        ) : isLocked ? (
          <LockIcon size={18} className="text-muted" />
        ) : (
          <PlayCircleIcon size={20} className="text-primary" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate leading-snug">
          <span className="text-muted font-normal mr-1">{index}.</span>
          {lesson.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
          {lesson.duration > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon size={10} />
              {formatDuration(lesson.duration)}
            </span>
          )}
          {isLocked ? (
            <span className="flex items-center gap-1 text-muted/60">
              <LockIcon size={10} /> Accès requis
            </span>
          ) : lesson.is_downloadable ? (
            <span className="flex items-center gap-1">
              <DownloadIcon size={10} />
              Téléch.
            </span>
          ) : null}
        </div>
      </div>

      {/* Right side */}
      {completed ? (
        <span className="text-xs font-bold text-success shrink-0">✓ Terminé</span>
      ) : isLocked ? (
        <LockIcon size={14} className="text-muted/50 shrink-0" />
      ) : (
        <ChevronRightIcon size={15} className="text-muted shrink-0" />
      )}
    </div>
  )

  // Locked lessons are NOT wrapped in a Link — clicking does nothing.
  // Access is enforced both here (no navigation) and server-side (lesson page gate + stream API).
  if (isLocked) return card

  return <Link href={`/lessons/${lesson.id}`}>{card}</Link>
}
