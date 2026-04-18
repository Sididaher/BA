'use client'
import { useState, useTransition } from 'react'
import { HeartIcon } from 'lucide-react'
import { toggleFavorite } from '@/actions/favorites'
import { cn } from '@/lib/utils'

export default function FavoriteButton({ courseId, isFavorited }: { courseId: string; isFavorited: boolean }) {
  const [active, setActive] = useState(isFavorited)
  const [, startTransition] = useTransition()

  function handleToggle() {
    setActive(v => !v)
    startTransition(() => toggleFavorite(courseId))
  }

  return (
    <button onClick={handleToggle} className="w-10 h-10 bg-card rounded-2xl border border-border/50 flex items-center justify-center active:scale-90 transition-transform">
      <HeartIcon size={20} className={cn('transition-colors', active ? 'fill-red-500 text-red-500' : 'text-muted')} />
    </button>
  )
}
