import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  className?: string
}

const variants = {
  blue: 'bg-primary-light text-primary',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-600',
  gray: 'bg-gray-100 text-gray-600',
}

export default function Badge({ children, variant = 'blue', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}
