import { cn } from '@/lib/utils'

export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded-2xl', className)} />
}

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-3xl border border-border/50 overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2.5 w-full" />
      </div>
    </div>
  )
}
