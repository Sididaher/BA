import {
  PhoneIcon, GlobeIcon, MessageCircleIcon,
  ChevronRightIcon, MailIcon, Share2Icon, SmartphoneIcon, HeartIcon,
} from 'lucide-react'

const CHANNELS = [
  {
    Icon: PhoneIcon,
    label: 'Service client',
    desc: '+222 XX XX XX XX',
    bg: 'bg-green-50',
    color: 'text-green-600',
  },
  {
    Icon: MailIcon,
    label: 'Email',
    desc: 'support@bacenglish.mr',
    bg: 'bg-blue-50',
    color: 'text-blue-600',
  },
  {
    Icon: GlobeIcon,
    label: 'Site web',
    desc: 'www.bacenglish.mr',
    bg: 'bg-sky-50',
    color: 'text-sky-600',
  },
  {
    Icon: Share2Icon,
    label: 'Facebook',
    desc: '@BacEnglish',
    bg: 'bg-indigo-50',
    color: 'text-indigo-600',
  },
  {
    Icon: MessageCircleIcon,
    label: 'WhatsApp',
    desc: '+222 XX XX XX XX',
    bg: 'bg-emerald-50',
    color: 'text-emerald-600',
  },
  {
    Icon: HeartIcon,
    label: 'Instagram',
    desc: '@bacenglish_mr',
    bg: 'bg-pink-50',
    color: 'text-pink-600',
  },
]

export default function ContactChannels() {
  return (
    <div className="space-y-3 pb-6">
      <p className="text-xs text-muted mb-4 leading-relaxed">
        Notre équipe est disponible pour t&apos;aider. Choisis le canal qui te convient le mieux.
      </p>
      {CHANNELS.map(({ Icon, label, desc, bg, color }) => (
        <button
          key={label}
          className="flex items-center gap-4 bg-card rounded-2xl shadow-sm border border-border/40 p-4 w-full text-left active:scale-[0.98] transition-transform"
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${bg}`}>
            <Icon size={18} className={color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text">{label}</p>
            <p className="text-xs text-muted mt-0.5 truncate">{desc}</p>
          </div>
          <ChevronRightIcon size={16} className="text-muted shrink-0" />
        </button>
      ))}
    </div>
  )
}
