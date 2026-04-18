'use client'
import { useTransition } from 'react'
import { deleteNote } from '@/actions/notes'
import { timeAgo } from '@/lib/utils'
import { Trash2Icon, BookOpenIcon } from 'lucide-react'
import Link from 'next/link'
import type { Note } from '@/types'
import { useState } from 'react'

export default function NoteCard({ note }: { note: Note }) {
  const [, startTransition] = useTransition()
  const [deleted, setDeleted] = useState(false)

  function handleDelete() {
    if (!confirm('Supprimer cette note ?')) return
    setDeleted(true)
    startTransition(() => deleteNote(note.id))
  }

  if (deleted) return null

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-text text-sm leading-snug flex-1">{note.title || 'Note sans titre'}</h3>
        <button onClick={handleDelete} className="text-muted hover:text-danger p-1 transition-colors shrink-0" aria-label="Supprimer">
          <Trash2Icon size={15} />
        </button>
      </div>
      {note.content && <p className="text-sm text-muted line-clamp-3">{note.content}</p>}
      <div className="flex items-center justify-between text-xs text-muted pt-1">
        <span>{timeAgo(note.updated_at)}</span>
        {note.lesson && (
          <Link href={`/lessons/${note.lesson.id}`} className="flex items-center gap-1 text-primary font-medium">
            <BookOpenIcon size={11} /> {note.lesson.title}
          </Link>
        )}
      </div>
    </div>
  )
}
