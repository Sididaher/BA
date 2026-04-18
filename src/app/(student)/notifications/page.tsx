import { getProfile } from '@/lib/auth/get-session'
import { getNotifications } from '@/actions/notifications'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { BellIcon } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'
import MarkAllReadButton from '@/components/shared/MarkAllReadButton'

export default async function NotificationsPage() {
  const profile = await getProfile()
  if (!profile) return null
  const notifications = await getNotifications(profile.id)
  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} non lue${unread !== 1 ? 's' : ''}` : 'Tout est lu'}
        action={unread > 0 ? <MarkAllReadButton /> : undefined}
      />
      <div className="px-5 space-y-2">
        {notifications.length === 0 ? (
          <EmptyState icon={<BellIcon size={32} className="text-muted/40" />} title="Aucune notification" description="Tu seras notifié des nouveaux cours et annonces ici." />
        ) : (
          notifications.map(n => (
            <div key={n.id} className={cn('bg-card rounded-2xl border p-4 space-y-1', n.is_read ? 'border-border/50' : 'border-primary/30 bg-blue-50/40')}>
              <div className="flex items-start gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', n.is_read ? 'bg-gray-100' : 'bg-primary-light')}>
                  <BellIcon size={14} className={n.is_read ? 'text-muted' : 'text-primary'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">{n.title}</p>
                  <p className="text-sm text-muted mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted mt-1.5">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
