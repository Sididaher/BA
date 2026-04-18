'use client'
import { TrendingUpIcon } from 'lucide-react'
import { daysUntilBac } from '@/lib/utils'

export default function BacCountdown() {
  const days = daysUntilBac()
  return (
    <div className="bg-gradient-to-r from-primary to-accent rounded-3xl p-5 text-white">
      <p className="text-sm font-medium text-blue-100">Compte à rebours Bac</p>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-5xl font-bold leading-none">{days}</span>
        <span className="text-lg font-medium pb-1">jours</span>
      </div>
      <p className="text-xs text-blue-100 mt-2 flex items-center gap-1">
        Examen prévu le 15 juin 2026 · Courage ! <TrendingUpIcon size={11} />
      </p>
    </div>
  )
}
