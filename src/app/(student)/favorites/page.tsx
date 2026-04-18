import { getProfile } from '@/lib/auth/get-session'
import { getFavorites } from '@/actions/favorites'
import FavoritesView from '@/components/favorites/FavoritesView'

export default async function FavoritesPage() {
  const profile = await getProfile()
  if (!profile) return null
  const favorites = await getFavorites(profile.id)
  return <FavoritesView favorites={favorites} />
}
