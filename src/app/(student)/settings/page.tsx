import PageHeader from '@/components/layout/PageHeader'
import { BellIcon, ShieldIcon, InfoIcon, ChevronRightIcon } from 'lucide-react'

const SETTINGS_SECTIONS = [
  {
    title: 'Préférences',
    items: [
      { icon: BellIcon, label: 'Notifications', desc: 'Gérer les alertes et rappels' },
    ],
  },
  {
    title: 'Sécurité',
    items: [
      { icon: ShieldIcon, label: 'Confidentialité', desc: 'Données personnelles et usage' },
    ],
  },
  {
    title: 'À propos',
    items: [
      { icon: InfoIcon, label: 'Version', desc: '1.0.0' },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Paramètres" />
      <div className="px-5 space-y-6">
        {SETTINGS_SECTIONS.map(section => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-card rounded-3xl border border-border/50 divide-y divide-border/50 overflow-hidden">
              {section.items.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text">{label}</p>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                  <ChevronRightIcon size={16} className="text-muted shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* App info */}
        <p className="text-center text-xs text-muted pb-4">
          BacEnglish — Plateforme d&apos;anglais pour les lycéens mauritaniens
        </p>
      </div>
    </div>
  )
}
