import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  color?: 'blue' | 'green'
  size?: 'sm' | 'md'
}

export default function ProgressBar({ value, max = 100, className, color = 'blue', size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={cn('w-full bg-gray-100 rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2.5', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', color === 'blue' ? 'bg-primary' : 'bg-success')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
