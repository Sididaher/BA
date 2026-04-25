'use client'
import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
    const variants = {
      primary: 'bg-primary text-white shadow-sm hover:bg-primary-dark',
      secondary: 'bg-primary-light text-primary hover:bg-blue-100',
      ghost: 'bg-transparent text-muted hover:bg-gray-100',
      danger: 'bg-danger text-white hover:bg-red-600',
    }
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-5 py-3 text-base',
      lg: 'px-6 py-4 text-lg',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Chargement…
          </span>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
