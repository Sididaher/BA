'use client'
import Link from 'next/link'
import {
  BellIcon, FileTextIcon, DownloadIcon,
  ClockIcon, HelpCircleIcon, ChevronRightIcon,
  BookOpenIcon, CheckCircle2Icon, PlayCircleIcon, HeartIcon,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import StatCard from '@/components/dashboard/StatCard'
import CourseCard from '@/components/courses/CourseCard'
import WelcomeHero from '@/components/dashboard/WelcomeHero'
import type { Profile, Course, DashboardStats } from '@/types'

interface Props {
  profile: Profile
  stats: DashboardStats
  courses: Course[]
  firstName: string
  greeting: string
}

const QUICK_ACTIONS = [
  { href: '/history',   Icon: ClockIcon,       label: 'Historique', bg: 'bg-blue-50',   fg: 'text-primary'       },
  { href: '/notes',     Icon: FileTextIcon,    label: 'Notes',      bg: 'bg-yellow-50', fg: 'text-yellow-600'    },
  { href: '/downloads', Icon: DownloadIcon,    label: 'Téléch.',    bg: 'bg-green-50',  fg: 'text-green-600'     },
  { href: '/help',      Icon: HelpCircleIcon,  label: 'Aide',       bg: 'bg-purple-50', fg: 'text-purple-600'    },
]

export default function DashboardView({
  profile, stats, courses, firstName, greeting,
}: Props) {
  const featured     = courses.slice(0, 6)
  const rest         = courses.slice(6)

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Sticky header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border/30 shadow-sm">
        <div className="max-w-md mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
            <div>
              <p className="text-[11px] text-muted leading-none">{greeting}</p>
              <p className="text-sm font-bold text-text leading-snug mt-0.5">{firstName}</p>
            </div>
          </div>
          <Link
            href="/notifications"
            className="w-9 h-9 rounded-full bg-bg border border-border/50 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Notifications"
          >
            <BellIcon size={18} className="text-muted" />
          </Link>
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────── */}
      <div className="max-w-md mx-auto px-5 pt-5 pb-28 space-y-6">

        {/* Stats (Notes & Favorites only) */}
        <div>
          <SectionRow title="Mon activité" />
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Mes notes" value={stats.totalNotes}      icon={<FileTextIcon      size={20} className="text-yellow-600" />} color="yellow" />
            <StatCard label="Favoris"           value={stats.totalFavorites}  icon={<HeartIcon         size={20} className="text-purple-600" />} color="purple" />
          </div>
        </div>

        {/* Quick actions (Removed Downloads & History) */}
        <div>
          <SectionRow title="Accès rapide" />
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/notes"
              className="bg-card rounded-2xl border border-border/40 shadow-sm p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-yellow-50">
                <FileTextIcon size={18} className="text-yellow-600" />
              </div>
              <span className="text-[10px] font-semibold text-muted text-center leading-tight">Notes</span>
            </Link>
            <Link
              href="/help"
              className="bg-card rounded-2xl border border-border/40 shadow-sm p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-purple-50">
                <HelpCircleIcon size={18} className="text-purple-600" />
              </div>
              <span className="text-[10px] font-semibold text-muted text-center leading-tight">Aide</span>
            </Link>
          </div>
        </div>

        {/* Horizontal course scroll */}
        {courses.length > 0 && (
          <div>
            <SectionRow title="Nos cours" href="/courses" />
            {/* Negative horizontal bleed so cards touch screen edges */}
            <div className="-mx-5">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-5 pb-2">
                {featured.map(course => (
                  <div key={course.id} className="snap-start shrink-0 w-[220px]">
                    <CourseCard course={course} />
                  </div>
                ))}

                {/* "Voir tout" tile */}
                <Link
                  href="/courses"
                  className="snap-start shrink-0 w-[100px] bg-primary-light rounded-3xl border border-primary/20 flex flex-col items-center justify-center gap-2 px-3 active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpenIcon size={18} className="text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary text-center leading-tight">
                    Voir tout
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Compact remaining courses list */}
        {rest.length > 0 && (
          <div>
            <SectionRow title="Plus de cours" href="/courses" />
            <div className="space-y-3">
              {rest.map(course => (
                <Link key={course.id} href={`/courses/${course.slug}`}>
                  <div className="flex items-center gap-4 bg-card rounded-2xl shadow-sm border border-border/40 p-4 active:scale-[0.98] transition-all hover:shadow-md">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center shrink-0 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpenIcon size={22} className="text-primary" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text truncate leading-snug">{course.title}</p>
                      {course.category && (
                        <p className="text-xs text-muted mt-0.5">{course.category}</p>
                      )}
                    </div>
                    <ChevronRightIcon size={16} className="text-muted shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

/* ── Shared section row ───────────────────────────────────────────────────── */
function SectionRow({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold text-text">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-xs font-semibold text-primary flex items-center gap-0.5 active:opacity-70 transition-opacity"
        >
          Voir tout <ChevronRightIcon size={13} />
        </Link>
      )}
    </div>
  )
}
