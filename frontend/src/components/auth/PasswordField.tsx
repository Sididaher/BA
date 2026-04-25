'use client'
import { useState } from 'react'
import { LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordFieldProps {
  value:       string
  onChange:    (v: string) => void
  onEnter?:    () => void
  label?:      string
  placeholder?: string
  error?:      string
  autoFocus?:  boolean
  disabled?:   boolean
  autoComplete?: string
}

export default function PasswordField({
  value, onChange, onEnter, label, placeholder = '••••••••',
  error, autoFocus, disabled, autoComplete = 'current-password',
}: PasswordFieldProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text">{label}</label>
      )}
      <div
        className={cn(
          'flex items-stretch rounded-2xl border bg-white overflow-hidden transition-all duration-150',
          error
            ? 'border-danger ring-2 ring-danger/10'
            : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10',
          disabled && 'opacity-50'
        )}
      >
        {/* Lock icon prefix */}
        <div className="flex items-center pl-3.5 pr-3 border-r border-border shrink-0">
          <LockIcon size={16} className="text-muted" aria-hidden />
        </div>

        {/* Input */}
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onEnter?.()}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 px-3.5 py-3.5 text-base text-text bg-transparent outline-none placeholder:text-muted/50"
        />

        {/* Show / hide toggle */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(s => !s)}
          disabled={disabled}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="flex items-center px-3.5 text-muted hover:text-text transition-colors disabled:pointer-events-none"
        >
          {show ? <EyeOffIcon size={16} aria-hidden /> : <EyeIcon size={16} aria-hidden />}
        </button>
      </div>

      {error && (
        <p className="text-sm text-danger px-0.5">{error}</p>
      )}
    </div>
  )
}
