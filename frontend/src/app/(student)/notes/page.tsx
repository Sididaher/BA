import { getProfile } from '@/lib/auth/get-session'
import { getNotes } from '@/actions/notes'
import NotesView from '@/components/notes/NotesView'

export default async function NotesPage() {
  const profile = await getProfile()
  if (!profile) return null
  const notes = await getNotes(profile.id)
  return <NotesView notes={notes} />
}
