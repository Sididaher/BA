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

  return (
    <Link href={`/lessons/${lesson.id}`}>
      <div className="flex items-center gap-3 bg-card rounded-2xl border border-border/40 shadow-sm p-4 active:scale-[0.98] transition-all hover:shadow-md">

        {/* State icon in bubble */}
        <div className={[
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
          completed  ? 'bg-green-50'    :
          isLocked   ? 'bg-gray-100'    :
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
            {lesson.is_downloadable && (
              <span className="flex items-center gap-1">
                <DownloadIcon size={10} />
                Téléch.
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        {completed ? (
          <span className="text-xs font-bold text-success shrink-0">✓ Terminé</span>
        ) : (
          <ChevronRightIcon size={15} className="text-muted shrink-0" />
        )}
      </div>
    </Link>
  )
}
