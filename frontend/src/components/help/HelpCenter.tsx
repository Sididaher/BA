'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, BellIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import FAQSection from './FAQSection'
import SupportSection from './SupportSection'

type MainTab = 'help' | 'support'

export default function HelpCenter() {
  const router  = useRouter()
  const [tab, setTab] = useState<MainTab>('help')

  const TABS: { key: MainTab; label: string }[] = [
    { key: 'help',    label: "Centre d'aide" },
    { key: 'support', label: 'Support en ligne' },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto">

        {/* ── Gradient header ────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-b-[40px] px-5 pt-12 pb-6">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Retour"
            >
              <ChevronLeftIcon size={20} className="text-white" />
            </button>

            <span className="text-white font-bold text-lg">
              {tab === 'help' ? "Centre d'aide" : 'Support en ligne'}
            </span>

            <Link
              href="/notifications"
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Notifications"
            >
              <BellIcon size={18} className="text-white" />
            </Link>
          </div>

          {/* Main tab switcher */}
          <div className="flex bg-white/15 rounded-2xl p-1 gap-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
                  tab === key
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-white/80 hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────── */}
        <div className="pb-28">
          {tab === 'help'
            ? <FAQSection />
            : <SupportSection />
          }
        </div>

      </div>
    </div>
  )
}
