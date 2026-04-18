'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeftIcon, ShieldCheckIcon, RefreshCwIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import AuthAlert, { friendlyError } from '@/components/auth/AuthAlert'

// ─── OTP digit boxes ──────────────────────────────────────────────────────────

function OtpBoxes({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string[]
  onChange: (v: string[]) => void
  onComplete?: (code: string) => void
  disabled?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function commit(next: string[]) {
    onChange(next)
    const code = next.join('')
    if (code.length === 6 && !next.includes('')) {
      onComplete?.(code)
    }
  }

  function handleChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...value]
    next[i] = val.slice(-1)
    commit(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const next = [...value]; next[i] = ''; commit(next)
      } else if (i > 0) {
        refs.current[i - 1]?.focus()
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = Array(6).fill('')
    pasted.split('').forEach((c, i) => { next[i] = c })
    commit(next)
    refs.current[Math.min(pasted.length, 5)]?.focus()
    e.preventDefault()
  }

  return (
    <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          disabled={disabled}
          className={cn(
            'w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none',
            'bg-white text-text transition-all duration-150',
            digit
              ? 'border-primary shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
              : 'border-border hover:border-muted/60',
            'focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VerifyOtpPage() {
  const router = useRouter()

  const [otp, setOtp]             = useState<string[]>(Array(6).fill(''))
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [phone, setPhone]         = useState('')

  useEffect(() => {
    const p = sessionStorage.getItem('otp_phone') ?? ''
    setPhone(p)
    if (!p) window.location.href = '/login'
  }, [])

  // Single-timeout countdown — no leak
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ── Verify ─────────────────────────────────────────────────────────────────
  const handleVerify = useCallback(async (autoCode?: string) => {
    const code = autoCode ?? otp.join('')
    if (code.length < 6) { setError('Entre les 6 chiffres du code.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: fnErr } = await supabase.functions.invoke('verify-otp', {
      body: { phone, code },
    })

    if (fnErr || !data?.session_token) {
      setError(friendlyError(fnErr?.message ?? data?.error))
      setLoading(false)
      return
    }

    // Exchange the raw token for an HTTP-only cookie via the Next.js API route.
    const res = await fetch('/api/auth/set-session', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ session_token: data.session_token }),
    })
    if (!res.ok) {
      setError('Impossible d\'établir la session. Réessaie.')
      setLoading(false)
      return
    }

    sessionStorage.removeItem('otp_phone')
    router.push('/dashboard')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, phone])

  // ── Resend ─────────────────────────────────────────────────────────────────
  async function handleResend() {
    setResending(true)
    setError('')
    const supabase = createClient()
    const { error: fnErr } = await supabase.functions.invoke('send-otp', { body: { phone } })
    if (fnErr) {
      setError(friendlyError(fnErr.message))
    } else {
      setCountdown(60)
      setOtp(Array(6).fill(''))
    }
    setResending(false)
  }

  const displayPhone = phone.replace(/^(\+222)(\d{2})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5')

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">

        {/* Top nav */}
        <div className="flex items-center px-6 pt-6 mb-6">
          <Link
            href="/login"
            className="w-10 h-10 rounded-2xl bg-white border border-border/70 flex items-center justify-center text-muted shadow-sm active:scale-95 hover:border-border hover:shadow transition-all duration-150"
            aria-label="Retour"
          >
            <ArrowLeftIcon size={18} />
          </Link>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center px-6 mb-10 animate-slide-up">
          {/* Badge */}
          <div className="relative flex items-center justify-center w-28 h-28 mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/[0.06]" />
            <div className="absolute inset-[10px] rounded-full bg-primary/[0.10]" />
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center border border-primary/20"
              style={{
                background: 'linear-gradient(145deg, #DBEAFE 0%, #EFF6FF 60%, #F0F9FF 100%)',
                boxShadow: '0 4px 16px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              <ShieldCheckIcon size={26} strokeWidth={1.75} className="text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text text-center tracking-tight">
            Vérifie ton numéro
          </h1>
          <p className="text-sm text-muted mt-2 text-center leading-relaxed">
            Code envoyé au{' '}
            <span className="font-semibold text-text tabular-nums">{displayPhone}</span>
          </p>
        </div>

        {/* Form card */}
        <div
          className="flex-1 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-10"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}
        >
          <div className="mb-7">
            <h2 className="text-base font-semibold text-text">Code à 6 chiffres</h2>
            <p className="text-xs text-muted mt-0.5">Valable 5 minutes · Ne le partage pas</p>
          </div>

          <OtpBoxes
            value={otp}
            onChange={v => { setOtp(v); setError('') }}
            onComplete={handleVerify}
            disabled={loading}
          />

          {error && <AuthAlert message={error} className="mt-5" />}

          {/* Resend — fixed height container prevents layout shift */}
          <div className="flex items-center justify-center mt-6 h-6">
            {countdown > 0 ? (
              <p className="text-sm text-muted">
                Renvoyer dans{' '}
                <span className="font-semibold text-text tabular-nums inline-block w-7">
                  {countdown}s
                </span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending || loading}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {resending && <RefreshCwIcon size={13} className="animate-spin" />}
                {resending ? 'Envoi…' : 'Renvoyer le code'}
              </button>
            )}
          </div>

          <Button
            fullWidth
            size="lg"
            loading={loading}
            onClick={() => handleVerify()}
            className="font-bold tracking-wide mt-8"
          >
            Confirmer
          </Button>

          <p className="text-center text-sm text-muted mt-6">
            Mauvais numéro ?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Modifier
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
