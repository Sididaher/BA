import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export default function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card rounded-3xl shadow-sm border border-border/50',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform duration-150',
        className
      )}
    >
      {children}
    </div>
  )
}
