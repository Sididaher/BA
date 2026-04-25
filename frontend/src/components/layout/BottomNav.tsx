'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { HomeIcon, BookOpenIcon, HeartIcon, UserIcon } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Accueil', Icon: HomeIcon },
  { href: '/courses', label: 'Cours', Icon: BookOpenIcon },
  { href: '/favorites', label: 'Favoris', Icon: HeartIcon },
  { href: '/profile', label: 'Profil', Icon: UserIcon },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-border/60 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all',
                active ? 'text-primary' : 'text-muted'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
