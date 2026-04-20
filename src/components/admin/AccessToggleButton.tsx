'use client'
import { useState, useTransition } from 'react'
import { grantLessonAccess, revokeLessonAccess } from '@/actions/access'
import { LockIcon, UnlockIcon } from 'lucide-react'

interface Props {
  studentId: string
  lessonId:  string
  hasAccess: boolean
}

export default function AccessToggleButton({ studentId, lessonId, hasAccess }: Props) {
  const [granted, setGranted] = useState(hasAccess)
  const [, startTransition]   = useTransition()

  function toggle() {
    const next = !granted
    setGranted(next)
    startTransition(async () => {
      if (next) {
        await grantLessonAccess(studentId, lessonId)
      } else {
        await revokeLessonAccess(studentId, lessonId)
      }
    })
  }

  return (
    <button
      onClick={toggle}
      title={granted ? 'Révoquer l\'accès' : 'Accorder l\'accès'}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95',
        granted
          ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
          : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700',
      ].join(' ')}
    >
      {granted
        ? <><UnlockIcon size={12} /> Accès</>
        : <><LockIcon    size={12} /> Verrouillé</>
      }
    </button>
  )
}
