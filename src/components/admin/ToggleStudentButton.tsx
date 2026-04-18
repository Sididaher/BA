'use client'
import { useTransition } from 'react'
import { toggleStudentActive } from '@/actions/students'

export default function ToggleStudentButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, start] = useTransition()
  return (
    <button
      onClick={() => start(() => toggleStudentActive(id, isActive))}
      disabled={pending}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        isActive
          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
      }`}
    >
      {pending ? '…' : isActive ? 'Désactiver' : 'Activer'}
    </button>
  )
}
