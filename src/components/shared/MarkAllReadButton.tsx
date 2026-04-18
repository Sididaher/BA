'use client'
import { useTransition } from 'react'
import { markAllRead } from '@/actions/notifications'

export default function MarkAllReadButton() {
  const [pending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => markAllRead())}
      disabled={pending}
      className="text-xs font-semibold text-primary disabled:opacity-50"
    >
      {pending ? '…' : 'Tout lire'}
    </button>
  )
}
