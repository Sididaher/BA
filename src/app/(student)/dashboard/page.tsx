import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-session'
import { getDashboardStats } from '@/actions/progress'
import { getCourses } from '@/actions/courses'
import DashboardView from '@/components/dashboard/DashboardView'

export default async function DashboardPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const [stats, courses] = await Promise.all([
    getDashboardStats(profile.id),
    getCourses(),
  ])

  const firstName = profile.full_name?.split(' ')[0] ?? 'Étudiant'
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <DashboardView
      profile={profile}
      stats={stats}
      courses={courses}
      firstName={firstName}
      greeting={greeting}
    />
  )
}
