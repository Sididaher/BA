'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, GraduationCapIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import AuthAlert, { friendlyError } from '@/components/auth/AuthAlert'
import PhoneField from '@/components/auth/PhoneField'
import PasswordField from '@/components/auth/PasswordField'

export default function LoginPage() {
  const [phoneDigits, setPhoneDigits] = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)

  const normalizedPhone = phoneDigits ? `+222${phoneDigits}` : ''

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    if (!/^[234678]\d{7}$/.test(phoneDigits)) {
      setError('Numéro invalide. Exemple : 36 00 00 00'); return
    }
    if (!password) {
      setError('Saisis ton mot de passe.'); return
    }

    setError(null)
    setLoading(true)

    try {
      console.log('LOGIN START')

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'apikey':        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
          body: JSON.stringify({ phone: normalizedPhone, password }),
        }
      )

      console.log('LOGIN RESPONSE STATUS', res.status)
      console.log('LOGIN CONTENT-TYPE', res.headers.get('content-type'))

      const loginRaw = await res.text()
      console.log('LOGIN RAW', loginRaw.slice(0, 300))

      let data: Record<string, unknown>
      try {
        data = JSON.parse(loginRaw)
      } catch {
        throw new Error(`login_non_json: ${loginRaw.slice(0, 200)}`)
      }
      console.log('LOGIN DATA', data)

      console.log('LOGIN DATA RECEIVED:', data)
      const token = data.session_token as string
      console.log('TOKEN EXTRACTED:', token ? `${token.slice(0, 8)}...` : 'UNDEFINED')

      if (!res.ok || !data?.success || !token) {
        throw new Error((data?.error as string) || 'login_failed')
      }

      console.log('CALLING SET-SESSION WITH TOKEN:', token.slice(0, 8))
      const setSessionRes = await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      console.log('SET SESSION STATUS', setSessionRes.status)
      console.log('SET SESSION CONTENT-TYPE', setSessionRes.headers.get('content-type'))

      const setSessionRaw = await setSessionRes.text()
      console.log('SET SESSION RAW', setSessionRaw.slice(0, 300))

      let setSessionData: Record<string, unknown>
      try {
        setSessionData = JSON.parse(setSessionRaw)
      } catch {
        throw new Error(`set_session_non_json: ${setSessionRaw.slice(0, 200)}`)
      }
      console.log('SET SESSION DATA', setSessionData)

      if (!setSessionRes.ok || !setSessionData?.success) {
        throw new Error((setSessionData?.error as string) || 'set_session_failed')
      }

      const dest = setSessionData?.role === 'admin' ? '/admin' : '/dashboard'
      console.log('REDIRECT TO', dest)
      window.location.href = dest
    } catch (err) {
      console.error('LOGIN FLOW ERROR', err)
      const msg = err instanceof Error ? err.message : 'login_failed'
      setError(friendlyError(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex-1 flex flex-col max-w-sm sm:max-w-md mx-auto w-full">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center pt-16 pb-10 px-6">

          <div className="relative mb-5 flex items-center justify-center w-28 h-28">
            <div className="absolute inset-0 rounded-3xl bg-primary/[0.06]" />
            <div className="absolute inset-[10px] rounded-3xl bg-primary/[0.10]" />
            <div
              className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #3B82F6 0%, #2563EB 100%)',
                boxShadow:  '0 8px 24px rgba(59,130,246,0.30), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <GraduationCapIcon size={36} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text tracking-tight">BacEnglish</h1>
          <p className="text-sm text-muted mt-1 text-center leading-relaxed">
            Prépare ton Bac en anglais, partout, tout le temps.
          </p>
        </div>

        {/* ── Form card ──────────────────────────────────────────────────── */}
        <div
          className="flex-1 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-10"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}
        >
          <div className="mb-8">
            <h2 className="text-xl font-bold text-text">Connexion</h2>
            <p className="text-sm text-muted mt-1">
              Entre ton numéro et ton mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <PhoneField
              digits={phoneDigits}
              onChange={v => { setPhoneDigits(v); setError(null) }}
              onEnter={handleSubmit}
              autoFocus={false}
            />

            <PasswordField
              value={password}
              onChange={v => { setPassword(v); setError(null) }}
              onEnter={handleSubmit}
              placeholder="Ton mot de passe"
              autoComplete="current-password"
            />

            {error && <AuthAlert message={error} />}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              className="font-bold tracking-wide mt-2"
            >
              <span className="flex items-center gap-2">
                Se connecter <ArrowRightIcon size={17} />
              </span>
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Register CTA */}
          <Link
            href="/register"
            className="flex items-center justify-center w-full py-3.5 rounded-2xl border-2 border-border text-sm font-semibold text-text bg-white active:bg-gray-50 hover:border-muted/50 transition-all duration-150"
          >
            Créer un compte gratuit
          </Link>

          <p className="text-center text-xs text-muted/70 mt-8 leading-relaxed">
            En continuant, tu acceptes nos{' '}
            <span className="text-muted underline underline-offset-2 cursor-pointer">
              conditions d&apos;utilisation
            </span>
            .
          </p>
        </div>

      </div>
    </div>
  )
}
