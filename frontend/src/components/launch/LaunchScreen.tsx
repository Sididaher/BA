'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCapIcon } from 'lucide-react'

export default function LaunchScreen() {
  const [logoVisible, setLogoVisible] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Logo pops in almost immediately
    const t1 = setTimeout(() => setLogoVisible(true), 80)
    // Content reveals after splash delay
    const t2 = setTimeout(() => setReady(true), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 overflow-hidden">

      {/* Logo — always rendered, slides up when ready */}
      <div
        style={{
          opacity: logoVisible ? 1 : 0,
          transform: ready
            ? 'translateY(-56px) scale(1)'
            : logoVisible ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.80)',
          transition: ready
            ? 'transform 680ms cubic-bezier(0.34,1.30,0.64,1)'
            : 'opacity 400ms ease-out, transform 500ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #3B82F6 0%, #2563EB 100%)',
              boxShadow: '0 14px 36px rgba(59,130,246,0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <GraduationCapIcon size={44} className="text-white" />
          </div>
          {/* Brand name */}
          <span className="text-2xl font-bold tracking-tight" style={{ color: '#1E293B' }}>
            BacEnglish
          </span>
        </div>
      </div>

      {/* Content — fades + slides up after splash */}
      <div
        className="w-full max-w-xs sm:max-w-sm mt-8"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 560ms ease-out, transform 560ms ease-out',
          transitionDelay: ready ? '80ms' : '0ms',
          pointerEvents: ready ? 'auto' : 'none',
        }}
      >
        <p
          className="text-center text-sm leading-relaxed mb-9"
          style={{ color: '#64748B' }}
        >
          Bienvenue dans BacEnglish&nbsp;— la plateforme d&apos;anglais
          pour les lycéens mauritaniens.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-4 rounded-2xl text-base font-bold text-center text-white active:scale-[0.97] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              boxShadow: '0 6px 22px rgba(59,130,246,0.38)',
            }}
          >
            Se connecter
          </Link>

          <Link
            href="/register"
            className="w-full py-4 rounded-2xl text-base font-bold text-center active:scale-[0.97] transition-transform"
            style={{
              color: '#3B82F6',
              background: 'rgba(59,130,246,0.06)',
              border: '2px solid rgba(59,130,246,0.22)',
            }}
          >
            S&apos;inscrire
          </Link>
        </div>
      </div>

    </div>
  )
}
