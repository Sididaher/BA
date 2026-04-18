'use client'
import { useState, useTransition } from 'react'
import { sendNotificationToAll } from '@/actions/notifications'

export default function AdminNotificationForm() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, start] = useTransition()

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    start(async () => {
      await sendNotificationToAll(title, message)
      setSent(true)
      setTitle('')
      setMessage('')
      setTimeout(() => setSent(false), 3000)
    })
  }

  const field = 'w-full rounded-xl border border-admin-border bg-admin-bg text-white px-4 py-3 text-sm placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <form onSubmit={handleSend} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Titre *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titre de la notification"
          required
          className={field}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Message *</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Contenu du message..."
          rows={4}
          required
          className={field + ' resize-none'}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        {pending ? 'Envoi…' : sent ? '✓ Envoyé à tous les étudiants' : 'Envoyer à tous les étudiants'}
      </button>
    </form>
  )
}
