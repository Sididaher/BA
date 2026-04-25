import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import DashboardView from '@/components/dashboard/DashboardView'

export default async function DashboardPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  // Single RPC call for all dashboard data
  const { data: dashboard, error } = await supabase
    .rpc('get_student_dashboard', { p_user_id: profile.id })

  if (error || !dashboard) {
    console.error('[Dashboard] RPC Error:', error)
    // Fallback or error handling
    return <div>Une erreur est survenue lors du chargement de votre tableau de bord.</div>
  }

  // Map backend JSON keys to frontend component props
  const { 
    profile: dbProfile, 
    stats, 
    recent_courses: courses 
  } = dashboard as any

  const firstName = dbProfile.full_name?.split(' ')[0] ?? 'Étudiant'
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <DashboardView
      profile={dbProfile}
      stats={{
        totalNotes: stats.total_notes,
        totalFavorites: stats.total_favorites,
        // Optional: you can add completedLessons if you decide to show them again
      } as any}
      courses={courses}
      firstName={firstName}
      greeting={greeting}
    />
  )
}
