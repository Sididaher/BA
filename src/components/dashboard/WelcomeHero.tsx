'use client'
import { TimerIcon, CalendarIcon, TrendingUpIcon } from 'lucide-react'
import { daysUntilBac } from '@/lib/utils'

interface Props {
  completedLessons: number
  totalLessons: number
}

export default function WelcomeHero({ completedLessons, totalLessons }: Props) {
  const days     = daysUntilBac()
  const progress = totalLessons > 0
    ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
    : 0

  return (
    <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-5 text-white relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.07] pointer-events-none" />
      <div className="absolute right-6 top-10 w-16 h-16 rounded-full bg-white/[0.07] pointer-events-none" />

      {/* Countdown */}
      <p className="text-xs font-medium text-blue-100 relative flex items-center gap-1">
        <TimerIcon size={12} /> Compte à rebours BAC
      </p>
      <div className="flex items-end gap-2 mt-1 relative">
        <span className="text-5xl font-bold leading-none tabular-nums">{days}</span>
        <span className="text-xl font-semibold pb-1 opacity-90">jours</span>
      </div>
      <p className="text-[11px] text-blue-100 mt-1.5 relative flex items-center gap-1">
        <CalendarIcon size={11} /> Examen prévu le 15 juin 2026 —
        <TrendingUpIcon size={11} /> Courage&nbsp;!
      </p>

      {/* Progress */}
      <div className="mt-4 pt-4 border-t border-white/20 relative">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-blue-100 font-medium">Progression globale</span>
          <span className="font-bold text-sm">{progress}%</span>
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${Math.max(completedLessons > 0 ? 4 : 0, progress)}%` }}
          />
        </div>
        <p className="text-[10px] text-blue-100 mt-1.5">
          {completedLessons > 0
            ? `${completedLessons} leçon${completedLessons !== 1 ? 's' : ''} complétée${completedLessons !== 1 ? 's' : ''} sur ${totalLessons}`
            : 'Commence ta première leçon !'}
        </p>
      </div>
    </div>
  )
}
