import { clsx, type ClassValue } from 'clsx'
import { differenceInDays, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BAC_EXAM_DATE } from '@/constants'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '0 min'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m} min`
}

export function daysUntilBac(): number {
  return Math.max(0, differenceInDays(BAC_EXAM_DATE, new Date()))
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

/* ─── Video URL helpers ───────────────────────────────────────────────────── */

export type VideoUrlType = 'youtube' | 'vimeo' | 'direct' | 'hls' | 'invalid'

/** Domains explicitly blocked — no paid content should ever live here */
const BLOCKED_HOSTS = new Set([
  'drive.google.com',
  'docs.google.com',
  'dropbox.com',
  'www.dropbox.com',
  'wetransfer.com',
  'mega.nz',
])

export function classifyVideoUrl(url: string): VideoUrlType {
  const s = url?.trim()
  if (!s) return 'invalid'
  try {
    const u = new URL(s)
    if (!['http:', 'https:'].includes(u.protocol)) return 'invalid'

    if (BLOCKED_HOSTS.has(u.hostname)) return 'invalid'

    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(u.hostname)) {
      if (u.pathname === '/watch' && u.searchParams.has('v')) return 'youtube'
      if (u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/')) return 'youtube'
      return 'invalid'
    }
    if (u.hostname === 'youtu.be' && u.pathname.length > 1) return 'youtube'

    if (['vimeo.com', 'www.vimeo.com'].includes(u.hostname)) return 'vimeo'

    if (u.pathname.includes('/storage/v1/object/')) return 'direct'

    const ext = u.pathname.split('.').pop()?.toLowerCase() ?? ''
    if (ext === 'm3u8' || u.pathname.endsWith('.m3u8')) return 'hls'
    if (['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv'].includes(ext)) return 'direct'

    return 'invalid'
  } catch {
    return 'invalid'
  }
}

/** Returns true when the URL points to this project's private Supabase Storage */
export function isPrivateStorageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base || !url) return false
  try {
    const baseHost = new URL(base).hostname
    const u = new URL(url.trim())
    return u.hostname === baseHost && u.pathname.includes('/storage/v1/object/')
  } catch {
    return false
  }
}

export function toYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim())
    let id: string | null = null
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1).split('/')[0]
    } else if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return url
      id = u.searchParams.get('v')
      if (!id && u.pathname.startsWith('/shorts/')) {
        id = u.pathname.split('/shorts/')[1]?.split('/')[0] ?? null
      }
    }
    return id ? `https://www.youtube.com/embed/${id}?rel=0` : null
  } catch {
    return null
  }
}

export function toVimeoEmbedUrl(url: string): string | null {
  try {
    const id = new URL(url.trim()).pathname.split('/').find(s => /^\d+$/.test(s))
    return id ? `https://player.vimeo.com/video/${id}` : null
  } catch {
    return null
  }
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('222')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`
  }
  return phone
}
