'use client'
import { useState, useTransition } from 'react'
import { markLessonCompleted } from '@/actions/progress'
import { upsertNote } from '@/actions/notes'
import Button from '@/components/ui/Button'
import AskTeacherModal from './AskTeacherModal'
import {
  CheckCircle2Icon, FileTextIcon, ChevronDownIcon,
  MessageCircleIcon,
} from 'lucide-react'
import type { Note } from '@/types'

interface LessonActionsProps {
  lessonId: string
  isCompleted: boolean
  existingNote?: Note | null
  lessonTitle?: string
}

export default function LessonActions({
  lessonId, isCompleted, existingNote, lessonTitle,
}: LessonActionsProps) {
  const [completed,    setCompleted]   = useState(isCompleted)
  const [showNote,     setShowNote]    = useState(false)
  const [showModal,    setShowModal]   = useState(false)
  const [noteTitle,    setNoteTitle]   = useState(existingNote?.title ?? '')
  const [noteContent,  setNoteContent] = useState(existingNote?.content ?? '')
  const [noteSaved,    setNoteSaved]   = useState(false)
  const [, startTransition] = useTransition()

  function handleMarkDone() {
    setCompleted(true)
    startTransition(() => markLessonCompleted(lessonId))
  }

  function handleSaveNote() {
    startTransition(async () => {
      await upsertNote(lessonId, noteTitle, noteContent, existingNote?.id)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    })
  }

  return (
    <>
      <div className="space-y-3 pb-6">

        {/* Mark done / Completed */}
        {!completed ? (
          <Button fullWidth onClick={handleMarkDone} variant="primary" size="lg">
            <CheckCircle2Icon size={18} className="mr-2" />
            Marquer comme terminé
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3.5 bg-green-50 border border-green-200 rounded-2xl text-success font-semibold text-sm">
            <CheckCircle2Icon size={18} />
            Leçon terminée !
          </div>
        )}

        {/* Notes toggle */}
        <button
          onClick={() => setShowNote(v => !v)}
          className="flex items-center gap-3 w-full bg-card border border-border/50 rounded-2xl px-4 py-3.5 text-sm font-medium text-text active:scale-[0.98] transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
            <FileTextIcon size={15} className="text-yellow-500" />
          </div>
          <span className="flex-1 text-left">
            {existingNote ? 'Modifier ma note' : 'Ajouter une note'}
          </span>
          <ChevronDownIcon
            size={16}
            className={`text-muted transition-transform duration-200 ${showNote ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Notes form */}
        {showNote && (
          <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3 animate-[slideUp_250ms_ease-out_both]">
            <input
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              placeholder="Titre de la note"
              className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder="Écris ta note ici…"
              rows={4}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
            />
            <Button
              onClick={handleSaveNote}
              variant={noteSaved ? 'secondary' : 'primary'}
              size="sm"
            >
              {noteSaved ? '✓ Sauvegardé !' : 'Sauvegarder la note'}
            </Button>
          </div>
        )}

        {/* Ask Teacher */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 w-full bg-green-50 border border-green-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-green-700 active:scale-[0.98] transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
            <MessageCircleIcon size={15} className="text-green-500" />
          </div>
          Demander au professeur
        </button>

      </div>

      {/* Ask Teacher Modal */}
      {showModal && (
        <AskTeacherModal
          onClose={() => setShowModal(false)}
          lessonTitle={lessonTitle}
        />
      )}
    </>
  )
}
