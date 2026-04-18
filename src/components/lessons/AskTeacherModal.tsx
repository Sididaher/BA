'use client'
import { MessageCircleIcon, XIcon } from 'lucide-react'

interface Props {
  onClose: () => void
  lessonTitle?: string
}

export default function AskTeacherModal({ onClose, lessonTitle }: Props) {
  const message = encodeURIComponent(
    `Bonjour, j'ai une question sur la leçon "${lessonTitle ?? 'une leçon'}" de BacEnglish.`,
  )
  // Replace with actual WhatsApp number
  const whatsappHref = `https://wa.me/22200000000?text=${message}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-[scaleIn_250ms_ease-out_both]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg flex items-center justify-center text-muted hover:text-text transition-colors"
          aria-label="Fermer"
        >
          <XIcon size={16} />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <MessageCircleIcon size={28} className="text-green-500" />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-text text-center">
          Demander au professeur
        </h3>
        <p className="text-sm text-muted text-center mt-2 leading-relaxed">
          Tu seras redirigé vers WhatsApp pour poser ta question directement à l&apos;enseignant.
        </p>

        {/* CTA */}
        <div className="flex flex-col gap-3 mt-6">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-2xl bg-green-500 text-white font-bold text-sm text-center active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <MessageCircleIcon size={16} />
            Ouvrir WhatsApp
          </a>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gray-100 text-text font-semibold text-sm active:scale-95 transition-transform"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
