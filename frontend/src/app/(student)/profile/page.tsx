import { getProfile } from '@/lib/auth/get-session'
import ProfileView from '@/components/profile/ProfileView'

export default async function ProfilePage() {
  const profile = await getProfile()
  if (!profile) return null
  return <ProfileView profile={profile} />
}
