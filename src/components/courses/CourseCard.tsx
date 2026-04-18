import Link from 'next/link'
import { ClockIcon, StarIcon, BookOpenIcon } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'
import type { Course } from '@/types'

interface CourseCardProps {
  course: Course
  progress?: number
}

export default function CourseCard({ course, progress }: CourseCardProps) {
  const lessonCount = course.lessons?.length ?? 0

  return (
    <Link href={`/courses/${course.slug}`}>
      <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/40 active:scale-[0.98] transition-all hover:shadow-md">

        {/* Thumbnail */}
        <div className="relative h-44 bg-gradient-to-br from-primary-light to-blue-100">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpenIcon size={48} className="text-primary/30" />
            </div>
          )}

          {/* Category badge */}
          {course.category && (
            <div className="absolute top-3 left-3">
              <Badge variant="blue">{course.category}</Badge>
            </div>
          )}

          {/* Duration overlay */}
          {course.total_duration > 0 && (
            <div className="absolute bottom-3 right-3 bg-black/55 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <ClockIcon size={10} />
              {formatDuration(course.total_duration)}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-text text-base leading-snug line-clamp-2">
            {course.title}
          </h3>

          {/* Meta chips */}
          <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
            {lessonCount > 0 && (
              <span className="flex items-center gap-1">
                <BookOpenIcon size={11} />{lessonCount} leçon{lessonCount !== 1 ? 's' : ''}
              </span>
            )}
            {course.rating > 0 && (
              <span className="flex items-center gap-1">
                <StarIcon size={11} className="fill-yellow-400 text-yellow-400" />
                {course.rating}
              </span>
            )}
            {course.level && (
              <span className="bg-bg border border-border/60 px-2 py-0.5 rounded-full">
                {course.level}
              </span>
            )}
          </div>

          {/* Progress */}
          {progress !== undefined && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Progression</span>
                <span className="text-primary font-bold">{progress}%</span>
              </div>
              <ProgressBar value={progress} size="sm" />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
