'use client'
import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeftIcon, SearchIcon,
  FileTextIcon, BookOpenIcon, Trash2Icon,
} from 'lucide-react'
import { deleteNote } from '@/actions/notes'
import { timeAgo } from '@/lib/utils'
import type { Note } from '@/types'

interface Props { notes: Note[] }

function groupByDate(notes: Note[]) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const today     = notes.filter(n => new Date(n.updated_at) >= todayStart)
  const yesterday = notes.filter(n => {
    const d = new Date(n.updated_at)
    return d >= yesterdayStart && d < todayStart
  })
  const older = notes.filter(n => new Date(n.updated_at) < yesterdayStart)

  return [
    ...(today.length     ? [{ label: "Aujourd'hui", notes: today }]     : []),
    ...(yesterday.length ? [{ label: 'Hier',        notes: yesterday }] : []),
    ...(older.length     ? [{ label: 'Plus ancien', notes: older }]     : []),
  ]
}

function NoteItem({ note }: { note: Note }) {
  const [deleted, setDeleted] = useState(false)
  const [, startTransition]   = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Supprimer cette note ?')) return
    setDeleted(true)
    startTransition(() => deleteNote(note.id))
  }

  if (deleted) return null

  const lessonHref = note.lesson ? `/lessons/${note.lesson.id}` : '#'

  return (
    <Link href={lessonHref}>
      <div className="flex items-start gap-4 bg-card rounded-2xl shadow-sm border border-border/40 p-4 active:scale-[0.98] transition-transform hover:shadow-md">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 mt-0.5">
          <FileTextIcon size={18} className="text-yellow-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text leading-snug truncate">
            {note.title || 'Note sans titre'}
          </p>
          {note.content && (
            <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
              {note.content}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted">{timeAgo(note.updated_at)}</span>
            {note.lesson && (
              <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                <BookOpenIcon size={10} />
                <span className="truncate max-w-[120px]">{note.lesson.title}</span>
              </span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-red-50 transition-colors active:scale-90 mt-0.5"
          aria-label="Supprimer"
        >
          <Trash2Icon size={14} />
        </button>
      </div>
    </Link>
  )
}

export default function NotesView({ notes }: Props) {
  const router  = useRouter()
  const [search, setSearch] = useState('')

  const filtered = notes.filter(n =>
    !search ||
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.content?.toLowerCase().includes(search.toLowerCase()) ||
    n.lesson?.title?.toLowerCase().includes(search.toLowerCase()),
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
              <span className="text-white font-bold text-lg">Mes Notes</span>
              {notes.length > 0 && (
                <p className="text-white/70 text-xs mt-0.5">
                  {notes.length} note{notes.length !== 1 ? 's' : ''}
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
              placeholder="Rechercher une note…"
              className="w-full rounded-full bg-white border-0 pl-11 pr-4 py-3 text-sm text-text placeholder:text-muted/60 outline-none shadow-sm"
            />
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-28">
          {notes.length === 0 ? (
            <EmptyNotes />
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
                    {group.notes.map(note => (
                      <NoteItem key={note.id} note={note} />
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

function EmptyNotes() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center">
        <FileTextIcon size={36} className="text-yellow-300" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-text">Aucune note</h3>
        <p className="text-sm text-muted mt-1 max-w-xs">
          Prends des notes en regardant tes leçons pour les retrouver ici.
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
