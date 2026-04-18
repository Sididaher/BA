import { InboxIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({
  icon = <InboxIcon size={32} className="text-muted/40" />,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-border/20 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description && <p className="text-sm text-muted max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
