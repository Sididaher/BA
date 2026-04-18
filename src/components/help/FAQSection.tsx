'use client'
import { useState } from 'react'
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import ContactChannels from './ContactChannels'

type SubTab  = 'faq' | 'contact'
type Category = 'all' | 'general' | 'account' | 'services'

const FAQS = [
  {
    id: 1, cat: 'general',
    q: 'Comment me connecter à la plateforme ?',
    a: 'Entre ton numéro de téléphone mauritanien (+222XXXXXXXX). Tu recevras un code OTP par SMS à confirmer.',
  },
  {
    id: 2, cat: 'general',
    q: 'Comment marquer une leçon comme terminée ?',
    a: 'Ouvre la leçon et appuie sur le bouton « Marquer comme terminée » en bas de la page vidéo.',
  },
  {
    id: 3, cat: 'services',
    q: 'Puis-je télécharger les cours ?',
    a: "Seuls les cours marqués comme téléchargeables par l'administrateur sont disponibles dans la page Téléchargements.",
  },
  {
    id: 4, cat: 'account',
    q: 'Comment sauvegarder des notes ?',
    a: "Dans chaque leçon, utilise la section Notes pour écrire et sauvegarder tes annotations. Retrouve-les dans l'onglet Notes.",
  },
  {
    id: 5, cat: 'services',
    q: 'Comment ajouter un cours en favori ?',
    a: "Sur la page de détail d'un cours, appuie sur l'icône cœur pour l'ajouter à tes favoris.",
  },
  {
    id: 6, cat: 'account',
    q: 'Je ne reçois pas le code SMS. Que faire ?',
    a: 'Vérifie que ton numéro est au format +222XXXXXXXX. Attends 60 secondes puis réessaie. Contacte le support si le problème persiste.',
  },
  {
    id: 7, cat: 'account',
    q: 'Comment changer mon nom affiché ?',
    a: "Va sur ta page Profil, appuie sur « Modifier le profil », mets à jour ton nom et appuie sur « Mettre à jour ».",
  },
  {
    id: 8, cat: 'general',
    q: 'La plateforme est-elle gratuite ?',
    a: "BacEnglish est actuellement accessible gratuitement pour tous les lycéens mauritaniens inscrits.",
  },
]

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all',      label: 'Tous' },
  { key: 'general',  label: 'Général' },
  { key: 'account',  label: 'Compte' },
  { key: 'services', label: 'Services' },
]

export default function FAQSection() {
  const [subTab,   setSubTab]   = useState<SubTab>('faq')
  const [category, setCategory] = useState<Category>('all')
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const filtered = FAQS.filter(f => {
    const matchCat    = category === 'all' || f.cat === category
    const matchSearch = !search || f.q.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="px-5 pt-5">

      {/* Sub-tab pills */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'faq',     label: 'FAQ' },
          { key: 'contact', label: 'Nous contacter' },
        ] as { key: SubTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={cn(
              'px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95',
              subTab === key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-card border border-border/50 text-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'faq' ? (
        <>
          {/* Category pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95',
                  category === key
                    ? 'bg-primary-light text-primary'
                    : 'bg-white border border-border/50 text-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une question…"
              className="w-full rounded-2xl border border-border bg-white pl-11 pr-4 py-3 text-sm text-text placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Accordion */}
          <div className="space-y-3 pb-6">
            {filtered.length === 0 ? (
              <p className="text-center text-muted text-sm py-10">Aucune question trouvée.</p>
            ) : (
              filtered.map(({ id, q, a }) => (
                <div
                  key={id}
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpanded(expanded === id ? null : id)}
                    className="flex items-center gap-3 w-full px-4 py-4 text-left"
                  >
                    <span className="flex-1 text-sm font-semibold text-text leading-snug">{q}</span>
                    {expanded === id
                      ? <ChevronUpIcon   size={16} className="text-primary shrink-0" />
                      : <ChevronDownIcon size={16} className="text-muted shrink-0" />
                    }
                  </button>
                  {expanded === id && (
                    <div className="px-4 pb-4 text-sm text-muted leading-relaxed border-t border-border/40 pt-3">
                      {a}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <ContactChannels />
      )}
    </div>
  )
}
