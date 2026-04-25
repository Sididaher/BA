'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  action?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, back, action, className }: PageHeaderProps) {
  const router = useRouter()
  return (
    <header className={cn('flex items-center gap-3 px-5 py-4 bg-bg sticky top-0 z-40', className)}>
      {back && (
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon size={22} className="text-text" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-text truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
