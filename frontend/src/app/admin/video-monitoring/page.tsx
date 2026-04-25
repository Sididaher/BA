import { requireAdmin } from '@/lib/auth/get-session'
import {
  getVideoEventOverview,
  getVideoEvents,
  getSuspiciousStudents,
  getLessonVideoStats,
} from '@/actions/video-monitoring'
import {
  ShieldAlertIcon, EyeIcon, SkipForwardIcon, EyeOffIcon,
  CalendarIcon, UsersIcon, ActivityIcon, VideoIcon,
} from 'lucide-react'

export const metadata = { title: 'Surveillance vidéo' }

function EventBadge({ type }: { type: string }) {
  if (type === 'stream_access') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
      <EyeIcon size={10} /> Accès
    </span>
  )
  if (type === 'seek_abuse') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">
      <SkipForwardIcon size={10} /> Seek abusif
    </span>
  )
  if (type === 'tab_hidden') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">
      <EyeOffIcon size={10} /> Onglet caché
    </span>
  )
  return <span className="text-xs text-slate-500">{type}</span>
}

function SeverityBadge({ total }: { total: number }) {
  if (total >= 20) return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold">Élevé</span>
  )
  if (total >= 8) return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-semibold">Moyen</span>
  )
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-semibold">Faible</span>
  )
}

function formatDT(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default async function VideoMonitoringPage() {
  await requireAdmin()

  const [overview, events, suspicious, lessonStats] = await Promise.all([
    getVideoEventOverview(),
    getVideoEvents({ limit: 100 }),
    getSuspiciousStudents(),
    getLessonVideoStats(),
  ])

  const STAT_CARDS = [
    { label: 'Événements totaux',   value: overview.total,           icon: ActivityIcon,    color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
    { label: 'Étudiants uniques',   value: overview.unique_students, icon: UsersIcon,       color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Accès vidéo',         value: overview.stream_access,   icon: EyeIcon,         color: 'text-green-400',  bg: 'bg-green-500/10'  },
    { label: 'Seek abusif',         value: overview.seek_abuse,      icon: SkipForwardIcon, color: 'text-red-400',    bg: 'bg-red-500/10'    },
    { label: 'Onglets cachés',      value: overview.tab_hidden,      icon: EyeOffIcon,      color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: "Aujourd'hui",         value: overview.today,           icon: CalendarIcon,    color: 'text-sky-400',    bg: 'bg-sky-500/10'    },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <ShieldAlertIcon size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Surveillance vidéo</h1>
          <p className="text-slate-400 text-sm mt-0.5">Audit des accès et signaux d&apos;abus</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-admin-surface rounded-2xl border border-admin-border p-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={17} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Suspicious students */}
        <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShieldAlertIcon size={16} className="text-red-400" />
            <h2 className="text-base font-bold text-white">Étudiants suspects</h2>
          </div>
          {suspicious.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucun signal suspect détecté</p>
          ) : (
            <div className="space-y-3">
              {suspicious.map(s => (
                <div key={s.user_id} className="flex items-center gap-3 py-2 border-b border-admin-border/60 last:border-0">
                  <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {(s.full_name ?? s.phone ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.full_name ?? 'Sans nom'}</p>
                    <p className="text-xs text-slate-400">{s.phone}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-red-400">{s.seek_abuse_count} seek</span>
                      <span className="text-xs text-yellow-400">{s.tab_hidden_count} tab</span>
                    </div>
                  </div>
                  <SeverityBadge total={s.total} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lesson activity */}
        <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <VideoIcon size={16} className="text-blue-400" />
            <h2 className="text-base font-bold text-white">Activité par leçon</h2>
          </div>
          {lessonStats.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucune activité enregistrée</p>
          ) : (
            <div className="space-y-3">
              {lessonStats.map(l => (
                <div key={l.lesson_id} className="flex items-start gap-3 py-2 border-b border-admin-border/60 last:border-0">
                  <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <VideoIcon size={15} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{l.title}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-blue-400">{l.stream_access_count} accès</span>
                      <span className="text-xs text-red-400">{l.seek_abuse_count} seek</span>
                      <span className="text-xs text-yellow-400">{l.tab_hidden_count} tab</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Events log */}
      <div className="bg-admin-surface rounded-2xl border border-admin-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <ActivityIcon size={16} className="text-slate-400" />
          <h2 className="text-base font-bold text-white">Journal des événements</h2>
          <span className="ml-auto text-xs text-slate-500">{events.length} entrées</span>
        </div>

        {events.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucun événement enregistré</p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Étudiant</th>
                  <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Leçon</th>
                  <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Événement</th>
                  <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4 hidden md:table-cell">IP</th>
                  <th className="text-left text-xs text-slate-500 font-medium pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => {
                  const meta = ev.metadata as Record<string, string>
                  return (
                    <tr key={ev.id} className="border-b border-admin-border/40 hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="text-white font-medium truncate max-w-[120px]">
                          {ev.profile?.full_name ?? 'Inconnu'}
                        </p>
                        <p className="text-xs text-slate-400">{ev.profile?.phone ?? ''}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-slate-300 truncate max-w-[140px]">
                          {ev.lesson?.title ?? ev.lesson_id.slice(0, 8) + '…'}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <EventBadge type={ev.event_type} />
                        {ev.event_type === 'seek_abuse' && meta.seekCount && (
                          <p className="text-xs text-slate-500 mt-0.5">{meta.seekCount}× en {Number(meta.windowMs) / 1000}s</p>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        <p className="text-xs text-slate-400 font-mono">{meta.ip ?? '—'}</p>
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <p className="text-xs text-slate-400">{formatDT(ev.created_at)}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
