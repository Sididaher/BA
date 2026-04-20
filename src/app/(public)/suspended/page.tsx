import Link from 'next/link'
import { ShieldOffIcon } from 'lucide-react'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-5">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <ShieldOffIcon size={32} className="text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-text">Compte suspendu</h1>
          <p className="text-sm text-muted leading-relaxed">
            Ton compte a été temporairement désactivé.<br />
            Contacte l&apos;administrateur pour plus d&apos;informations.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
