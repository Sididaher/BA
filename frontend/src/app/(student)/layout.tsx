import { redirect } from 'next/navigation'
import StudentShell from '@/components/layout/StudentShell'
import { requireAuth } from '@/lib/auth/get-session'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth()
  if (profile.role === 'admin') redirect('/admin')
  return <StudentShell>{children}</StudentShell>
}
