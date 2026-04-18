'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeftIcon, ChevronRightIcon,
  HeartIcon, SearchIcon, BookOpenIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Favorite } from '@/types'

interface Props { favorites: Favorite[] }

export default function FavoritesView({ favorites }: Props) {
  const router  = useRouter()
  const [search, setSearch] = useState('')

  const filtered = favorites.filter(fav =>
    !search ||
    fav.course?.title.toLowerCase().includes(search.toLowerCase()) ||
    fav.course?.category?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto">

        {/* ── Gradient header ──────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-b-[40px] px-5 pt-12 pb-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Retour"
            >
              <ChevronLeftIcon size={20} className="text-white" />
            </button>
            <div className="text-center">
              <span className="text-white font-bold text-lg">Mes Favoris</span>
              {favorites.length > 0 && (
                <p className="text-white/70 text-xs mt-0.5">
                  {favorites.length} cours sauvegardé{favorites.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="w-9" />
          </div>

          {/* Search */}
          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un cours…"
              className="w-full rounded-full bg-white border-0 pl-11 pr-4 py-3 text-sm text-text placeholder:text-muted/60 outline-none shadow-sm"
            />
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-28">
          {favorites.length === 0 ? (
            <EmptyFavorites />
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted text-sm py-12">Aucun résultat pour &quot;{search}&quot;</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(fav => fav.course && (
                <Link key={fav.id} href={`/courses/${fav.course.slug}`}>
                  <div className="flex items-center gap-4 bg-card rounded-2xl shadow-sm border border-border/40 p-4 active:scale-[0.98] transition-transform hover:shadow-md">
                    {/* Icon / Thumbnail */}
                    <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center shrink-0 overflow-hidden">
                      {fav.course.thumbnail_url ? (
                        <img
                          src={fav.course.thumbnail_url}
                          alt={fav.course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpenIcon size={20} className="text-primary" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate leading-snug">
                        {fav.course.title}
                      </p>
                      {fav.course.category && (
                        <p className="text-xs text-muted mt-0.5 truncate">{fav.course.category}</p>
                      )}
                    </div>

                    {/* Heart + chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      <HeartIcon size={14} className="text-red-400 fill-red-400" />
                      <ChevronRightIcon size={16} className="text-muted" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
        <HeartIcon size={36} className="text-red-300" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-text">Aucun favori</h3>
        <p className="text-sm text-muted mt-1 max-w-xs">
          Ajoute des cours à tes favoris pour les retrouver facilement.
        </p>
      </div>
      <Link
        href="/courses"
        className="mt-2 px-6 py-3 rounded-2xl bg-primary text-white text-sm font-bold active:scale-95 transition-transform shadow-sm"
      >
        Explorer les cours
      </Link>
    </div>
  )
}
