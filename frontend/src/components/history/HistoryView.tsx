'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeftIcon, ChevronRightIcon,
  PlayCircleIcon, SearchIcon, ClockIcon,
} from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { HistoryEntry } from '@/types'

interface Props { items: HistoryEntry[] }

function groupByDate(items: HistoryEntry[]) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const today     = items.filter(i => new Date(i.viewed_at) >= todayStart)
  const yesterday = items.filter(i => {
    const d = new Date(i.viewed_at)
    return d >= yesterdayStart && d < todayStart
  })
  const older = items.filter(i => new Date(i.viewed_at) < yesterdayStart)

  return [
    ...(today.length     ? [{ label: "Aujourd'hui", items: today }]     : []),
    ...(yesterday.length ? [{ label: 'Hier',        items: yesterday }] : []),
    ...(older.length     ? [{ label: 'Plus ancien', items: older }]     : []),
  ]
}

export default function HistoryView({ items }: Props) {
  const router  = useRouter()
  const [search, setSearch] = useState('')

  const valid = items.filter(e => e.lesson?.id)

  const filtered = valid.filter(e =>
    !search ||
    e.lesson?.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.lesson?.course?.title?.toLowerCase().includes(search.toLowerCase()),
  )

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto">

        {/* ── Gradient header ──────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-b-[40px] px-5 pt-12 pb-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Retour"
            >
              <ChevronLeftIcon size={20} className="text-white" />
            </button>
            <div className="text-center">
              <span className="text-white font-bold text-lg">Historique</span>
              {valid.length > 0 && (
                <p className="text-white/70 text-xs mt-0.5">
                  {valid.length} leçon{valid.length !== 1 ? 's' : ''} regardée{valid.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="w-9" />
          </div>

          {/* Search */}
          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une leçon…"
              className="w-full rounded-full bg-white border-0 pl-11 pr-4 py-3 text-sm text-text placeholder:text-muted/60 outline-none shadow-sm"
            />
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-28">
          {valid.length === 0 ? (
            <EmptyHistory />
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted text-sm py-12">Aucun résultat pour &quot;{search}&quot;</p>
          ) : (
            <div className="space-y-6">
              {groups.map(group => (
                <div key={group.label}>
                  {/* Section label */}
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3 px-1">
                    {group.label}
                  </p>
                  <div className="space-y-3">
                    {group.items.map(entry => (
                      <Link key={entry.id} href={`/lessons/${entry.lesson!.id}`}>
                        <div className="flex items-center gap-4 bg-card rounded-2xl shadow-sm border border-border/40 p-4 active:scale-[0.98] transition-transform hover:shadow-md">
                          {/* Thumbnail / Icon */}
                          <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center shrink-0 overflow-hidden">
                            {entry.lesson?.course?.thumbnail_url ? (
                              <img
                                src={entry.lesson.course.thumbnail_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <PlayCircleIcon size={22} className="text-primary" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text truncate leading-snug">
                              {entry.lesson?.title}
                            </p>
                            <p className="text-xs text-muted mt-0.5 truncate">
                              {entry.lesson?.course?.title}
                            </p>
                          </div>

                          {/* Time + chevron */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] text-muted">{timeAgo(entry.viewed_at)}</span>
                            <ChevronRightIcon size={14} className="text-muted" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center">
        <ClockIcon size={36} className="text-primary/50" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-text">Aucun historique</h3>
        <p className="text-sm text-muted mt-1 max-w-xs">
          Commence à regarder des leçons pour les retrouver ici.
        </p>
      </div>
      <Link
        href="/courses"
        className="mt-2 px-6 py-3 rounded-2xl bg-primary text-white text-sm font-bold active:scale-95 transition-transform shadow-sm"
      >
        Explorer les cours
      </Link>
    </div>
  )
}
