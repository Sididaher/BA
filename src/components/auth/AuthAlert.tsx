import { AlertCircleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthAlertProps {
  message: string
  className?: string
}

/** Maps raw API error codes/messages to human-friendly French strings. */
export function friendlyError(raw: string | undefined | null): string {
  if (!raw) return 'Une erreur est survenue. Réessaie.'
  const r = raw.toLowerCase()
  if (r.includes('rate_limit') || r.includes('trop de demand'))
    return 'Trop de tentatives. Attends quelques minutes avant de réessayer.'
  if (r.includes('invalid_phone') || r.includes('numéro') || r.includes('phone'))
    return 'Numéro de téléphone invalide. Vérifie le format.'
  if (r.includes('invalid_credentials'))
    return 'Numéro ou mot de passe incorrect.'
  if (r.includes('account_already_exists') || r.includes('phone_already_registered'))
    return 'Un compte avec ce numéro existe déjà. Connecte-toi.'
  if (r.includes('account_not_found'))
    return 'Aucun compte trouvé avec ce numéro. Inscris-toi d\'abord.'
  if (r.includes('account_inactive'))
    return 'Ce compte a été désactivé. Contacte le support.'
  if (r.includes('weak_password'))
    return 'Le mot de passe doit contenir au moins 8 caractères.'
  if (r.includes('password_mismatch'))
    return 'Les mots de passe ne correspondent pas.'
  if (r.includes('verification_token_expired') || r.includes('verification_token_used'))
    return 'La vérification a expiré. Recommence depuis le début.'
  if (r.includes('verification_token') || r.includes('phone_verification'))
    return 'Code de vérification invalide. Recommence.'
  if (r.includes('sms_provider_invalid_response'))
    return 'Réponse invalide du service SMS. Réessaie dans un instant.'
  if (r.includes('sms_') || r.includes('sms failure') || r.includes('chinguisoft') || r.includes('envoyer le sms'))
    return 'Impossible d\'envoyer le SMS. Vérifie ta connexion et réessaie.'
  if (r.includes('otp_not_found') || r.includes('invalid_code') || r.includes('expiré') || r.includes('incorrect'))
    return 'Code incorrect ou expiré. Demande un nouveau code.'
  if (r.includes('max_attempts') || r.includes('too_many') || r.includes('trop de tent'))
    return 'Trop de tentatives. Demande un nouveau code.'
  if (r.includes('missing_chinguisoft'))
    return 'Le service SMS n\'est pas encore configuré. Contacte le support.'
  if (r.includes('missing_env') || r.includes('missing_supabase') || r.includes('config') || r.includes('missing_'))
    return 'Problème de configuration du serveur. Contacte le support.'
  if (r.includes('network') || r.includes('fetch') || r.includes('réseau'))
    return 'Problème de connexion réseau. Vérifie internet et réessaie.'
  if (r.includes('session') || r.includes('connexion'))
    return 'Erreur lors de la connexion. Réessaie.'
  if (r.includes('db_') || r.includes('database') || r.includes('interne'))
    return 'Erreur interne. Réessaie dans un instant.'
  return 'Une erreur est survenue. Réessaie.'
}

export default function AuthAlert({ message, className }: AuthAlertProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3.5 animate-slide-up',
        'bg-red-50 border-red-200/80',
        className
      )}
    >
      <AlertCircleIcon
        size={16}
        className="text-danger shrink-0 mt-0.5"
        aria-hidden
      />
      <p className="text-sm text-danger leading-snug">{message}</p>
    </div>
  )
}
