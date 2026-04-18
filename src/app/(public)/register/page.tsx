'use client'
import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeftIcon, ArrowRightIcon, CheckIcon,
  UserIcon, PhoneIcon, ShieldCheckIcon, LockIcon,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import AuthAlert, { friendlyError } from '@/components/auth/AuthAlert'
import PhoneField from '@/components/auth/PhoneField'
import PasswordField from '@/components/auth/PasswordField'

type Step      = 1 | 2 | 3 | 4
type Direction = 'forward' | 'back'

// ─── Step progress indicator ──────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Nom' },
    { n: 2, label: 'Tél.' },
    { n: 3, label: 'Code' },
    { n: 4, label: 'Mot de passe' },
  ]
  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const done   = current > s.n
        const active = current === s.n
        return (
          <Fragment key={s.n}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                  'transition-all duration-300 ease-out',
                  done   && 'bg-primary text-white shadow-sm shadow-primary/30',
                  active && 'bg-primary text-white ring-4 ring-primary/15 shadow-sm shadow-primary/30',
                  !done && !active && 'bg-white border-2 border-border text-muted'
                )}
              >
                {done ? <CheckIcon size={13} strokeWidth={3} /> : s.n}
              </div>
              <span className={cn(
                'text-[9px] font-semibold uppercase tracking-wider transition-colors duration-300',
                active ? 'text-primary' : done ? 'text-primary/60' : 'text-muted/60'
              )}>
                {s.label}
              </span>
            </div>
            {i < 3 && (
              <div className="flex-1 h-[2px] rounded-full mx-1.5 bg-border overflow-hidden mb-5">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: current > s.n ? '100%' : '0%' }}
                />
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

// ─── Step icon badge ──────────────────────────────────────────────────────────

function StepBadge({ step }: { step: Step }) {
  const icons = {
    1: <UserIcon        size={26} strokeWidth={1.75} className="text-primary" />,
    2: <PhoneIcon       size={26} strokeWidth={1.75} className="text-primary" />,
    3: <ShieldCheckIcon size={26} strokeWidth={1.75} className="text-primary" />,
    4: <LockIcon        size={26} strokeWidth={1.75} className="text-primary" />,
  }
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <div className="absolute inset-0 rounded-full bg-primary/[0.06]" />
      <div className="absolute inset-[10px] rounded-full bg-primary/[0.10]" />
      <div
        className="relative w-16 h-16 rounded-full flex items-center justify-center border border-primary/20"
        style={{
          background: 'linear-gradient(145deg, #DBEAFE 0%, #EFF6FF 60%, #F0F9FF 100%)',
          boxShadow:  '0 4px 16px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        {icons[step]}
      </div>
      <div
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
        style={{ boxShadow: '0 2px 6px rgba(59,130,246,0.35)' }}
      >
        {step}
      </div>
    </div>
  )
}

// ─── OTP digit boxes ──────────────────────────────────────────────────────────

function OtpInput({
  value, onChange, onComplete, disabled,
}: {
  value:       string[]
  onChange:    (v: string[]) => void
  onComplete?: (code: string) => void
  disabled?:   boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function commit(next: string[]) {
    onChange(next)
    const code = next.join('')
    if (code.length === 6 && !next.includes('')) onComplete?.(code)
  }

  function handleChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...value]; next[i] = val.slice(-1); commit(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (value[i]) { const next = [...value]; next[i] = ''; commit(next) }
      else if (i > 0) refs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = Array(6).fill('')
    pasted.split('').forEach((c, idx) => { next[idx] = c })
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
          type="text" inputMode="numeric" maxLength={1}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

// ─── Name input ───────────────────────────────────────────────────────────────

function NameField({
  value, onChange, onEnter, error,
}: {
  value:    string
  onChange: (v: string) => void
  onEnter:  () => void
  error:    string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text">Prénom et nom</label>
      <div
        className={cn(
          'flex items-stretch rounded-2xl border bg-white overflow-hidden transition-all duration-150',
          error
            ? 'border-danger ring-2 ring-danger/10'
            : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'
        )}
      >
        <div className="flex items-center pl-3.5 pr-3 border-r border-border shrink-0">
          <UserIcon size={16} className="text-muted" aria-hidden />
        </div>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onEnter()}
          className="flex-1 px-3.5 py-3.5 text-base text-text bg-transparent outline-none placeholder:text-muted/50"
          placeholder="Ex : Mohamed Ahmed"
          type="text"
          autoComplete="name"
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-danger px-0.5">{error}</p>}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [step, setStep]           = useState<Step>(1)
  const [direction, setDirection] = useState<Direction>('forward')

  // Step 1
  const [name, setName]           = useState('')
  // Step 2
  const [phoneDigits, setPhoneDigits] = useState('')
  // Step 3
  const [otp, setOtp]             = useState<string[]>(Array(6).fill(''))
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Step 3 → 4 handoff
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState('')
  // Step 4
  const [password, setPassword]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current) }, [])

  const fullPhone    = phoneDigits ? `+222${phoneDigits}` : ''
  const displayDigits = phoneDigits.replace(/(\d{2})(?=\d)/g, '$1 ')

  const stepMeta: Record<Step, { title: string; subtitle: string }> = {
    1: { title: 'Crée ton compte',     subtitle: 'Comment tu t\'appelles ?' },
    2: { title: 'Ton numéro',          subtitle: 'On t\'enverra un code de confirmation.' },
    3: { title: 'Vérifie le code',     subtitle: `Code envoyé au +222 ${displayDigits}` },
    4: { title: 'Ton mot de passe',    subtitle: 'Choisis un mot de passe pour sécuriser ton compte.' },
  }

  // ── Countdown ───────────────────────────────────────────────────────────────
  function startCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setCountdown(60)
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current!); countdownRef.current = null; return 0 }
        return c - 1
      })
    }, 1000)
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  function goToStep(next: Step, dir: Direction) {
    setError(''); setDirection(dir); setStep(next)
  }

  function handleBack() {
    if (step === 1) { router.push('/login'); return }
    goToStep((step - 1) as Step, 'back')
  }

  // ── Step 1 — name ────────────────────────────────────────────────────────────
  function handleStep1() {
    const trimmed = name.trim()
    if (!trimmed)               { setError('Saisis ton prénom et ton nom.'); return }
    if (trimmed.length < 3)     { setError('Le nom doit contenir au moins 3 caractères.'); return }
    if (!trimmed.includes(' ')) { setError('Saisis ton prénom ET ton nom de famille.'); return }
    goToStep(2, 'forward')
  }

  // ── Step 2 — phone + send OTP ─────────────────────────────────────────────────
  async function handleStep2() {
    if (!/^[234678]\d{7}$/.test(phoneDigits)) {
      setError('Numéro invalide. Exemple : 36 00 00 00'); return
    }
    setLoading(true); setError('')
    const { error: fnErr } = await supabase.functions.invoke('send-otp', {
      body: { phone: fullPhone },
    })
    setLoading(false)
    if (fnErr) { setError(friendlyError(fnErr.message)); return }
    goToStep(3, 'forward')
    startCountdown()
  }

  // ── Step 3 — verify OTP → get phone_verified_token ───────────────────────────
  const handleStep3 = useCallback(async (autoCode?: string) => {
    const code = autoCode ?? otp.join('')
    if (code.length < 6) { setError('Entre les 6 chiffres du code.'); return }
    setLoading(true); setError('')

    const { data, error: fnErr } = await supabase.functions.invoke('verify-otp', {
      body: { phone: fullPhone, code },
    })

    setLoading(false)

    if (fnErr || !data?.phone_verified_token) {
      setError(friendlyError(fnErr?.message ?? data?.error)); return
    }

    setPhoneVerifiedToken(data.phone_verified_token)
    goToStep(4, 'forward')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, fullPhone])

  // ── Step 4 — create password + finalize account ───────────────────────────────
  const handleStep4 = useCallback(async () => {
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.'); return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.'); return
    }

    setError('')
    setLoading(true)
    console.log('REGISTER STEP4 START')

    try {
      console.log('REGISTER FINALIZE FETCH START')
      const fnRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/finalize-registration`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'apikey':        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
          body: JSON.stringify({
            phone_verified_token: phoneVerifiedToken,
            password,
            name: name.trim(),
          }),
        }
      )
      console.log('REGISTER FINALIZE status', fnRes.status)

      const data = await fnRes.json()
      console.log('REGISTER FINALIZE DATA', { success: data?.success, hasToken: !!data?.session_token, error: data?.error })

      if (!fnRes.ok || !data?.session_token) {
        setError(friendlyError(data?.error))
        return
      }

      console.log('REGISTER SET SESSION START')
      const sessionRes = await fetch('/api/auth/set-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ session_token: data.session_token }),
      })
      console.log('REGISTER SET SESSION status', sessionRes.status)

      if (!sessionRes.ok) {
        setError('Impossible d\'établir la session. Réessaie.')
        return
      }

      const sessionJson = await sessionRes.json()
      const dest = sessionJson?.role === 'admin' ? '/admin' : '/dashboard'
      console.log('REGISTER REDIRECT TO', dest)
      window.location.href = dest
    } catch (err) {
      console.error('REGISTER STEP4 ERROR', err)
      setError('Problème de connexion réseau. Vérifie internet et réessaie.')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password, confirmPassword, phoneVerifiedToken, name])

  // ── Resend OTP ────────────────────────────────────────────────────────────────
  async function handleResend() {
    setLoading(true); setError('')
    const { error: fnErr } = await supabase.functions.invoke('send-otp', {
      body: { phone: fullPhone },
    })
    setLoading(false)
    if (fnErr) { setError(friendlyError(fnErr.message)); return }
    setOtp(Array(6).fill(''))
    startCountdown()
  }

  function handleContinue() {
    if      (step === 1) handleStep1()
    else if (step === 2) handleStep2()
    else if (step === 3) handleStep3()
    else                 handleStep4()
  }

  const animClass       = direction === 'forward' ? 'animate-step-forward' : 'animate-step-back'
  const { title, subtitle } = stepMeta[step]

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex-1 flex flex-col max-w-sm sm:max-w-md mx-auto w-full px-6 pt-6 pb-8">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-2xl bg-white border border-border/70 flex items-center justify-center text-muted shadow-sm active:scale-95 hover:border-border hover:shadow transition-all duration-150"
            aria-label="Retour"
          >
            <ArrowLeftIcon size={18} />
          </button>
          <Link
            href="/login"
            className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            Connexion
          </Link>
        </div>

        {/* Progress — static, no animation */}
        <div className="mb-10">
          <StepIndicator current={step} />
        </div>

        {/* Animated content — badge + title + field */}
        <div key={step} className={cn('flex-1 flex flex-col', animClass)}>

          <div className="flex justify-center mb-7">
            <StepBadge step={step} />
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-text tracking-tight">{title}</h1>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{subtitle}</p>
          </div>

          <div className="space-y-4">

            {/* ── Step 1 — name ─────────────────────────────────────────── */}
            {step === 1 && (
              <NameField
                value={name}
                onChange={v => { setName(v); setError('') }}
                onEnter={handleStep1}
                error={error}
              />
            )}

            {/* ── Step 2 — phone ─────────────────────────────────────────── */}
            {step === 2 && (
              <PhoneField
                digits={phoneDigits}
                onChange={v => { setPhoneDigits(v); setError('') }}
                onEnter={handleStep2}
                error={error}
                autoFocus
              />
            )}

            {/* ── Step 3 — OTP ──────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <OtpInput
                  value={otp}
                  onChange={v => { setOtp(v); setError('') }}
                  onComplete={handleStep3}
                  disabled={loading}
                />
                <div className="text-center pt-1">
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
                      disabled={loading}
                      className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Renvoyer le code
                    </button>
                  )}
                </div>
                {error && <AuthAlert message={error} />}
              </div>
            )}

            {/* ── Step 4 — password ─────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-3">
                <PasswordField
                  label="Mot de passe"
                  value={password}
                  onChange={v => { setPassword(v); setError('') }}
                  placeholder="Minimum 8 caractères"
                  autoFocus
                  disabled={loading}
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={v => { setConfirmPassword(v); setError('') }}
                  onEnter={handleStep4}
                  placeholder="Répète ton mot de passe"
                  disabled={loading}
                  autoComplete="new-password"
                />
                {error && <AuthAlert message={error} />}
              </div>
            )}

            {/* Errors for steps 1 & 2 shown inline in their fields */}
            {error && step !== 1 && step !== 3 && step !== 4 && (
              <AuthAlert message={error} />
            )}
          </div>
        </div>

        {/* CTA — outside animated block */}
        <div className="pt-6 space-y-4">
          <Button
            fullWidth
            size="lg"
            loading={loading}
            onClick={handleContinue}
            className="font-bold tracking-wide"
          >
            <span className="flex items-center gap-2">
              {step === 3
                ? 'Confirmer'
                : step === 4
                ? 'Créer mon compte'
                : <> Continuer <ArrowRightIcon size={16} /></>
              }
            </span>
          </Button>

          {step === 1 && (
            <p className="text-center text-sm text-muted">
              Déjà inscrit ?{' '}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                Se connecter
              </Link>
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
