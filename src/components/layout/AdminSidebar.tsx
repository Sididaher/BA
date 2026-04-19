'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboardIcon, UsersIcon, BookOpenIcon, VideoIcon,
  BellIcon, BarChart2Icon, LogOutIcon, ShieldAlertIcon,
} from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboardIcon, exact: true },
  { href: '/admin/students', label: 'Étudiants', Icon: UsersIcon },
  { href: '/admin/courses', label: 'Cours', Icon: BookOpenIcon },
  { href: '/admin/lessons', label: 'Leçons', Icon: VideoIcon },
  { href: '/admin/notifications', label: 'Notifications', Icon: BellIcon },
  { href: '/admin/analytics', label: 'Analytiques', Icon: BarChart2Icon },
  { href: '/admin/video-monitoring', label: 'Surveillance', Icon: ShieldAlertIcon },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <aside className="w-16 lg:w-60 shrink-0 min-h-screen bg-admin-bg flex flex-col">
      <div className="px-3 lg:px-6 py-6 border-b border-admin-border flex items-center justify-center lg:justify-start">
        <span className="text-white font-bold text-lg tracking-tight hidden lg:inline">BacEnglish</span>
        <span className="lg:ml-2 text-xs text-blue-400 font-medium hidden lg:inline">Admin</span>
        <span className="text-white font-bold text-xl lg:hidden">B</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active ? 'bg-primary text-white' : 'text-slate-400 hover:bg-admin-surface hover:text-white'
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-2 py-4 border-t border-admin-border">
        <button
          onClick={handleLogout}
          title="Déconnexion"
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-admin-surface hover:text-white transition-colors"
        >
          <LogOutIcon size={18} className="shrink-0" />
          <span className="hidden lg:inline">Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
