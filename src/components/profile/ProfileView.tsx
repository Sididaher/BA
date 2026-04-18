'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeftIcon, ChevronRightIcon,
  BellIcon, PencilIcon, DownloadIcon,
  HelpCircleIcon, LogOutIcon,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import ProfileEditForm from '@/components/shared/ProfileEditForm'
import { formatPhone } from '@/lib/utils'
import type { Profile } from '@/types'

interface Props { profile: Profile }

type MenuItem = {
  icon: React.ElementType
  label: string
  danger?: boolean
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never })

export default function ProfileView({ profile }: Props) {
  const router = useRouter()
  const [showEdit,        setShowEdit]        = useState(false)
  const [showModal,       setShowModal]       = useState(false)
  const [loggingOut,      setLoggingOut]      = useState(false)

  async function confirmLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const MENU: MenuItem[] = [
    { icon: PencilIcon,     label: 'Modifier le profil',  onClick: () => setShowEdit(v => !v) },
    { icon: DownloadIcon,   label: 'Téléchargements',     href: '/downloads' },
    { icon: HelpCircleIcon, label: 'Aide & Support',      href: '/help' },
    { icon: LogOutIcon,     label: 'Déconnexion',         onClick: () => setShowModal(true), danger: true },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto relative">

        {/* ── Gradient header ────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-b-[40px] px-5 pt-12 pb-16">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Retour"
            >
              <ChevronLeftIcon size={20} className="text-white" />
            </button>

            <span className="text-white font-bold text-lg">Profil</span>

            <Link
              href="/notifications"
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Notifications"
            >
              <BellIcon size={18} className="text-white" />
            </Link>
          </div>
        </div>

        {/* ── Avatar (overlapping header / card) ─────────────────── */}
        <div className="flex justify-center -mt-14 relative z-10 animate-[fadeScaleIn_400ms_ease-out_both]">
          <div className="ring-4 ring-white rounded-full shadow-xl">
            <Avatar name={profile.full_name} src={profile.avatar_url} size="2xl" />
          </div>
        </div>

        {/* ── User info card ──────────────────────────────────────── */}
        <div className="mx-5 mt-4 bg-card rounded-3xl shadow-lg p-6 text-center animate-[slideUp_400ms_ease-out_100ms_both]">
          <h2 className="text-lg font-bold text-text leading-snug">
            {profile.full_name ?? 'Étudiant'}
          </h2>
          <p className="text-sm text-muted mt-1">{formatPhone(profile.phone ?? '')}</p>
        </div>

        {/* ── Edit form (collapsible) ─────────────────────────────── */}
        {showEdit && (
          <div className="mx-5 mt-3 bg-card rounded-3xl shadow-sm border border-border/50 p-5 animate-[slideUp_300ms_ease-out_both]">
            <ProfileEditForm profile={profile} />
          </div>
        )}

        {/* ── Menu list ───────────────────────────────────────────── */}
        <div className="mx-5 mt-4 space-y-3 pb-28 animate-[slideUp_400ms_ease-out_150ms_both]">
          {MENU.map(item => {
            const { icon: Icon, label, danger } = item

            const iconWrap = (
              <div className={[
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                danger ? 'bg-red-50' : 'bg-primary-light',
              ].join(' ')}>
                <Icon size={18} className={danger ? 'text-danger' : 'text-primary'} />
              </div>
            )

            const rowCls = [
              'flex items-center gap-4 bg-card rounded-2xl shadow-sm border border-border/40',
              'p-4 w-full text-left active:scale-[0.98] transition-transform',
            ].join(' ')

            const textCls = `flex-1 text-sm font-semibold ${danger ? 'text-danger' : 'text-text'}`

            if (item.href) {
              return (
                <Link key={label} href={item.href} className={rowCls}>
                  {iconWrap}
                  <span className={textCls}>{label}</span>
                  <ChevronRightIcon size={16} className="text-muted shrink-0" />
                </Link>
              )
            }

            return (
              <button key={label} onClick={item.onClick} className={rowCls}>
                {iconWrap}
                <span className={textCls}>{label}</span>
                <ChevronRightIcon size={16} className="text-muted shrink-0" />
              </button>
            )
          })}
        </div>

      </div>

      {/* ── Logout modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-[scaleIn_250ms_ease-out_both]">

            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogOutIcon size={22} className="text-danger" />
            </div>

            <h3 className="text-base font-bold text-text text-center">Fin de session</h3>
            <p className="text-sm text-muted text-center mt-2 leading-relaxed">
              Es-tu sûr de vouloir te déconnecter de&nbsp;BacEnglish&nbsp;?
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-60"
              >
                {loggingOut ? 'Déconnexion…' : 'Oui, me déconnecter'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={loggingOut}
                className="w-full py-3.5 rounded-2xl bg-gray-100 text-text font-semibold text-sm active:scale-95 transition-transform disabled:opacity-40"
              >
                Annuler
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
