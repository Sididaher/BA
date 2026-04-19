'use client'
import { useTransition, useState, useRef, useEffect } from 'react'
import { setStudentSubscription } from '@/actions/students'
import { ChevronDownIcon } from 'lucide-react'

interface Props {
  id:                     string
  subscriptionStatus:     string
  subscriptionExpiresAt:  string | null
}

const OPTIONS = [
  { label: '1 mois',  months: 1  },
  { label: '3 mois',  months: 3  },
  { label: '6 mois',  months: 6  },
  { label: '1 an',    months: 12 },
  { label: 'Révoquer', months: 0 },
]

function fmtExpiry(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SubscriptionButton({ id, subscriptionStatus, subscriptionExpiresAt }: Props) {
  const [pending, start] = useTransition()
  const [open, setOpen]  = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function select(months: number) {
    setOpen(false)
    start(() => setStudentSubscription(id, months))
  }

  const isActive = subscriptionStatus === 'active'

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={pending}
        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          isActive
            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
            : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
        }`}
      >
        {pending ? '…' : isActive ? `Actif ${fmtExpiry(subscriptionExpiresAt) ? '· ' + fmtExpiry(subscriptionExpiresAt) : ''}` : 'Aucun abonnement'}
        <ChevronDownIcon size={11} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-admin-surface border border-admin-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
          {OPTIONS.map(opt => (
            <button
              key={opt.months}
              onClick={() => select(opt.months)}
              className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-white/5 ${
                opt.months === 0 ? 'text-red-400' : 'text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
