import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/utils'
import AdminNotificationForm from '@/components/admin/AdminNotificationForm'

export default async function AdminNotificationsPage() {
  await requireAdmin()
  const supabase = await createClient()
  // Uses admin SELECT policy — see supabase/schema.sql "Admins can select all notifications"
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, message, created_at, user_id, profiles!notifications_user_id_fkey(full_name, phone)')
    .order('created_at', { ascending: false })
    .limit(50)

  const items = notifications ?? []

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-slate-400 text-sm mt-1">Envoyer des messages à tous les étudiants</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send form */}
        <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
          <h2 className="text-base font-bold text-white mb-4">Envoyer une notification</h2>
          <AdminNotificationForm />
        </div>

        {/* History */}
        <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
          <h2 className="text-base font-bold text-white mb-4">
            Historique récent
            {items.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({items.length})</span>}
          </h2>
          {items.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucune notification envoyée.</p>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-hide">
              {items.map(n => {
                const profile = (n as any).profiles
                return (
                  <div key={n.id} className="border border-admin-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-white text-sm line-clamp-1">{n.title}</p>
                      <p className="text-xs text-slate-500 shrink-0">{timeAgo(n.created_at)}</p>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{n.message}</p>
                    {profile && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        → {profile.full_name ?? profile.phone ?? 'Étudiant'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
