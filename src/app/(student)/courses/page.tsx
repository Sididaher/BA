import { Suspense } from 'react'
import Link from 'next/link'
import { getCourses } from '@/actions/courses'
import { COURSE_CATEGORIES } from '@/constants'
import CourseCard from '@/components/courses/CourseCard'
import EmptyState from '@/components/ui/EmptyState'
import CoursesFilter from '@/components/courses/CoursesFilter'
import Skeleton from '@/components/ui/Skeleton'
import { BellIcon, SearchIcon } from 'lucide-react'

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const { category, q } = await searchParams
  const allCourses = await getCourses()

  const filtered = allCourses.filter(c => {
    const matchCat = !category || c.category === category
    const matchQ   = !q || c.title.toLowerCase().includes(q.toLowerCase())
    return matchCat && matchQ
  })

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto">

        {/* ── Gradient header ──────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-b-[40px] px-5 pt-12 pb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/70 text-xs font-medium">Bibliothèque</p>
              <h1 className="text-white font-bold text-xl leading-tight">Nos Cours</h1>
            </div>
            <Link
              href="/notifications"
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Notifications"
            >
              <BellIcon size={18} className="text-white" />
            </Link>
          </div>

          {/* Search + filter */}
          <Suspense fallback={<Skeleton className="h-12 rounded-full" />}>
            <CoursesFilter categories={[...COURSE_CATEGORIES]} />
          </Suspense>
        </div>

        {/* ── Course list ───────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-28">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={32} className="text-muted/40" />}
              title="Aucun cours trouvé"
              description="Modifie ta recherche ou reviens plus tard."
            />
          ) : (
            <>
              <p className="text-xs text-muted font-semibold mb-4">
                {filtered.length} cours disponible{filtered.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
