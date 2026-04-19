'use client'
import { useTransition } from 'react'
import { toggleStudentFlag } from '@/actions/students'
import { FlagIcon } from 'lucide-react'

export default function FlagStudentButton({
  id,
  isFlagged,
}: {
  id: string
  isFlagged: boolean
}) {
  const [pending, start] = useTransition()
  return (
    <button
      onClick={() => start(() => toggleStudentFlag(id, isFlagged))}
      disabled={pending}
      title={isFlagged ? 'Retirer le signalement' : 'Signaler cet étudiant'}
      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        isFlagged
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
      }`}
    >
      {pending ? '…' : <><FlagIcon size={11} />{isFlagged ? 'Signalé' : 'Signaler'}</>}
    </button>
  )
}
