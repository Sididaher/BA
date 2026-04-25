'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTransition, useState } from 'react'

export default function CoursesFilter({ categories }: { categories: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const current = searchParams.get('category') ?? ''

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); updateParam('q', e.target.value) }}
          placeholder="Rechercher un cours…"
          className="w-full pl-11 pr-4 py-3 rounded-full border border-border bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => updateParam('category', '')}
          className={cn('shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors', !current ? 'bg-primary text-white' : 'bg-card border border-border text-muted')}
        >
          Tous
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => updateParam('category', cat === current ? '' : cat)}
            className={cn('shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors', current === cat ? 'bg-primary text-white' : 'bg-card border border-border text-muted')}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}
