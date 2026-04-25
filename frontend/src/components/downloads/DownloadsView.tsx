'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeftIcon, ChevronRightIcon, SearchIcon,
  DownloadIcon, BookOpenIcon, ClockIcon,
  PlayCircleIcon, FileTextIcon, CheckCircle2Icon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { Lesson, Course } from '@/types'

type DownloadLesson = Lesson & { course?: Pick<Course, 'id' | 'title' | 'slug'> }
type FilterType = 'all' | 'video' | 'text'

interface Props { items: DownloadLesson[] }

/* ── Helpers ───────────────────────────────────────────────────────────── */
function lessonType(lesson: DownloadLesson): 'video' | 'text' {
  return lesson.video_url ? 'video' : 'text'
}

function groupByDate(items: DownloadLesson[]) {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const today     = items.filter(i => new Date(i.created_at) >= todayStart)
  const yesterday = items.filter(i => {
    const d = new Date(i.created_at)
    return d >= yesterdayStart && d < todayStart
  })
  const older = items.filter(i => new Date(i.created_at) < yesterdayStart)

  return [
    ...(today.length     ? [{ label: "Aujourd'hui", items: today }]     : []),
    ...(yesterday.length ? [{ label: 'Hier',        items: yesterday }] : []),
    ...(older.length     ? [{ label: 'Plus anciens', items: older }]    : []),
  ]
}

/* ── Type icon ─────────────────────────────────────────────────────────── */
function TypeIcon({ lesson }: { lesson: DownloadLesson }) {
  if (lessonType(lesson) === 'video') {
    return (
      <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center shrink-0">
        <PlayCircleIcon size={22} className="text-primary" />
      </div>
    )
  }
  return (
    <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center shrink-0">
      <FileTextIcon size={22} className="text-yellow-600" />
    </div>
  )
}

/* ── Download card ─────────────────────────────────────────────────────── */
function DownloadCard({ lesson }: { lesson: DownloadLesson }) {
  const type = lessonType(lesson)

  return (
    <Link href={`/lessons/${lesson.id}`}>
      <div className="flex items-center gap-4 bg-card rounded-2xl shadow-sm border border-border/40 p-4
                      active:scale-[0.98] transition-all duration-150 hover:shadow-md hover:border-border/60">

        <TypeIcon lesson={lesson} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text truncate leading-snug">
            {lesson.title}
          </p>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
            {lesson.course && (
              <span className="flex items-center gap-1 truncate max-w-[140px]">
                <BookOpenIcon size={10} className="shrink-0" />
                {lesson.course.title}
              </span>
            )}
            {lesson.duration > 0 && (
              <span className="flex items-center gap-1 shrink-0">
                <ClockIcon size={10} />
                {formatDuration(lesson.duration)}
              </span>
            )}
          </div>

          {/* Type tag */}
          <div className="mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
              ${type === 'video'
                ? 'bg-primary-light text-primary'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
              {type === 'video' ? <PlayCircleIcon size={9} /> : <FileTextIcon size={9} />}
              {type === 'video' ? 'Vidéo' : 'Leçon'}
            </span>
          </div>
        </div>

        {/* Status + chevron */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600
                           bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            <CheckCircle2Icon size={9} />
            Disponible
          </span>
          <ChevronRightIcon size={14} className="text-muted" />
        </div>

      </div>
    </Link>
  )
}

/* ── Date section ──────────────────────────────────────────────────────── */
function DownloadSection({ label, items }: { label: string; items: DownloadLesson[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <p className="text-xs font-bold text-muted uppercase tracking-wider">{label}</p>
        <span className="text-[10px] font-bold text-muted/60 bg-border/30 px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="space-y-3">
        {items.map(lesson => (
          <DownloadCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  )
}

/* ── Filter chips ──────────────────────────────────────────────────────── */
const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',   label: 'Tous' },
  { key: 'video', label: 'Vidéos' },
  { key: 'text',  label: 'Leçons' },
]

function FilterChips({
  active, counts, onChange,
}: {
  active: FilterType
  counts: Record<FilterType, number>
  onChange: (f: FilterType) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5">
      {FILTERS.map(({ key, label }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full text-xs font-bold
                        border transition-all duration-200 active:scale-95
                        ${isActive
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-card text-muted border-border/50 hover:border-primary/40'
                        }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
              ${isActive ? 'bg-white/20 text-white' : 'bg-border/40 text-muted/70'}`}>
              {counts[key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Summary bar ───────────────────────────────────────────────────────── */
function SummaryBar({ items }: { items: DownloadLesson[] }) {
  const videos = items.filter(i => lessonType(i) === 'video').length
  const texts  = items.filter(i => lessonType(i) === 'text').length

  return (
    <div className="flex items-center gap-3 bg-card rounded-2xl border border-border/40 shadow-sm p-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-green-50 shrink-0">
        <DownloadIcon size={18} className="text-green-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-text">
          {items.length} fichier{items.length !== 1 ? 's' : ''} disponible{items.length !== 1 ? 's' : ''}
        </p>
        <p className="text-[11px] text-muted mt-0.5">
          {videos > 0 && `${videos} vidéo${videos !== 1 ? 's' : ''}`}
          {videos > 0 && texts > 0 && ' · '}
          {texts > 0 && `${texts} leçon${texts !== 1 ? 's' : ''} texte`}
        </p>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-bold text-green-600
                      bg-green-50 border border-green-200 px-2 py-1 rounded-full shrink-0">
        <CheckCircle2Icon size={10} />
        Hors ligne
      </div>
    </div>
  )
}

/* ── Empty state ───────────────────────────────────────────────────────── */
function EmptyDownloads({ isFiltered, search }: { isFiltered?: boolean; search?: string }) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-border/30 flex items-center justify-center">
          <SearchIcon size={28} className="text-muted/50" />
        </div>
        <div>
          <p className="text-sm font-bold text-text">Aucun résultat</p>
          <p className="text-xs text-muted mt-1 max-w-[200px] leading-relaxed">
            {search
              ? `Aucun fichier pour "${search}"`
              : 'Aucun fichier dans cette catégorie'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
      {/* Stacked circles decorative */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-green-50/60" />
        <div className="absolute inset-3 rounded-full bg-green-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <DownloadIcon size={36} className="text-green-300" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-text">Aucun téléchargement</h3>
        <p className="text-sm text-muted mt-2 max-w-xs leading-relaxed">
          Les leçons marquées comme disponibles hors ligne apparaîtront ici.
        </p>
      </div>

      <Link
        href="/courses"
        className="mt-1 px-8 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold
                   active:scale-95 transition-transform shadow-sm"
      >
        Explorer les cours
      </Link>
    </div>
  )
}

/* ── Main view ─────────────────────────────────────────────────────────── */
export default function DownloadsView({ items }: Props) {
  const router  = useRouter()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<FilterType>('all')

  const counts = useMemo<Record<FilterType, number>>(() => ({
    all:   items.length,
    video: items.filter(i => lessonType(i) === 'video').length,
    text:  items.filter(i => lessonType(i) === 'text').length,
  }), [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.course?.title.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' || lessonType(item) === filter
      return matchSearch && matchFilter
    })
  }, [items, search, filter])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  const hasItems    = items.length > 0
  const hasFiltered = filtered.length > 0

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto">

        {/* ── Gradient header ──────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-b-[40px] px-5 pt-12 pb-6 shadow-lg">

          {/* Top row */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center
                         active:scale-90 transition-transform"
              aria-label="Retour"
            >
              <ChevronLeftIcon size={20} className="text-white" />
            </button>

            <div className="text-center">
              <span className="text-white font-bold text-lg">Téléchargements</span>
              {hasItems && (
                <p className="text-white/70 text-xs mt-0.5">
                  {items.length} fichier{items.length !== 1 ? 's' : ''} disponible{items.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <SlidersHorizontalIcon size={16} className="text-white" />
            </div>
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
              placeholder="Rechercher un téléchargement…"
              className="w-full rounded-full bg-white border-0 pl-11 pr-4 py-3
                         text-sm text-text placeholder:text-muted/60 outline-none shadow-sm"
            />
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-28 space-y-5">

          {!hasItems ? (
            <EmptyDownloads />
          ) : (
            <>
              {/* Summary bar */}
              <SummaryBar items={items} />

              {/* Filter chips */}
              <FilterChips active={filter} counts={counts} onChange={setFilter} />

              {/* Results */}
              {!hasFiltered ? (
                <EmptyDownloads isFiltered search={search} />
              ) : (
                <div className="space-y-6">
                  {groups.map(group => (
                    <DownloadSection
                      key={group.label}
                      label={group.label}
                      items={group.items}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  )
}
