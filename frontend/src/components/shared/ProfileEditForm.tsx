'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Profile } from '@/types'

export default function ProfileEditForm({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.full_name ?? '')
  const [saved, setSaved] = useState(false)
  const [, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-3">
      <Input
        label="Nom complet"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Ton nom complet"
      />
      <Button onClick={handleSave} variant={saved ? 'secondary' : 'primary'} size="sm">
        {saved ? '✓ Sauvegardé' : 'Mettre à jour'}
      </Button>
    </div>
  )
}
