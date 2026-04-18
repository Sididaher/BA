'use client'
import { LogOutIcon } from 'lucide-react'


export default function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    // Hard navigation: clears all App Router cache and avoids
    // the pushState/refresh race condition that crashes on Safari.
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-red-200 text-danger text-sm font-semibold hover:bg-red-50 transition-colors"
    >
      <LogOutIcon size={16} /> Déconnexion
    </button>
  )
}
