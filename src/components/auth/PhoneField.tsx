'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface PhoneFieldProps {
  /** Controlled value — the 8 digits AFTER +222 (no prefix) */
  digits: string
  onChange: (digits: string) => void
  onEnter?: () => void
  error?: string
  autoFocus?: boolean
  disabled?: boolean
}

/**
 * Phone input split into a fixed +222 prefix section and a digit input.
 * The parent always works with raw 8-digit strings; this component handles
 * the display formatting and strips non-numeric chars on input.
 */
const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(
  ({ digits, onChange, onEnter, error, autoFocus, disabled }, ref) => {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
      onChange(raw)
    }

    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text">
          Numéro de téléphone
        </label>

        {/* Input row: prefix block + digit field in one visual container */}
        <div
          className={cn(
            'flex items-stretch rounded-2xl border bg-white overflow-hidden',
            'transition-all duration-150',
            error
              ? 'border-danger ring-2 ring-danger/10'
              : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'
          )}
        >
          {/* Country prefix — purely decorative, not interactive */}
          <div className="flex items-center gap-1.5 pl-3.5 pr-3 border-r border-border shrink-0 select-none">
            <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded leading-none">MR</span>
            <span className="text-sm font-semibold text-muted whitespace-nowrap">+222</span>
          </div>

          {/* Digit input */}
          <input
            ref={ref}
            value={digits}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && onEnter?.()}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            autoFocus={autoFocus}
            disabled={disabled}
            placeholder="36 00 00 00"
            className={cn(
              'flex-1 px-3.5 py-3.5 text-base text-text bg-transparent outline-none',
              'placeholder:text-muted/50 tracking-wide',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          />
        </div>

        {error ? (
          <p className="text-sm text-danger px-0.5">{error}</p>
        ) : (
          <p className="text-xs text-muted px-0.5">Format : +222 XX XX XX XX</p>
        )}
      </div>
    )
  }
)
PhoneField.displayName = 'PhoneField'
export default PhoneField
