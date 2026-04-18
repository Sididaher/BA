'use client'
import { useRef, useEffect, useState } from 'react'
import { updateWatchedSeconds, markLessonCompleted } from '@/actions/progress'
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'
import {
  classifyVideoUrl, toYoutubeEmbedUrl, toVimeoEmbedUrl,
} from '@/lib/utils'

interface VideoPlayerProps {
  /** /api/lesson-stream/[id] — used for direct video playback */
  streamUrl: string
  /** Original URL from the DB — used to decide which player to render */
  rawVideoUrl: string
  lessonId: string
  isProtected: boolean
  watermarkText?: string
}

function Watermark({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-white/20 font-bold whitespace-nowrap"
          style={{ fontSize: 'clamp(11px, 2.8vw, 20px)', transform: 'rotate(-22deg)', letterSpacing: '0.06em' }}
        >
          {text}
        </span>
      </div>
      <div className="absolute bottom-3 right-3">
        <span className="text-white/30 text-[10px] font-semibold">{text}</span>
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="aspect-video bg-gray-50 rounded-2xl border border-border/50 flex flex-col items-center justify-center gap-3 text-center px-6">
      <AlertCircleIcon size={32} className="text-muted" />
      <p className="text-sm font-semibold text-text">Impossible de charger la vidéo</p>
      <p className="text-xs text-muted">Vérifie ta connexion ou actualise la page.</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-xs font-semibold text-primary mt-1"
      >
        <RefreshCwIcon size={13} /> Réessayer
      </button>
    </div>
  )
}

export default function VideoPlayer({
  streamUrl,
  rawVideoUrl,
  lessonId,
  isProtected,
  watermarkText,
}: VideoPlayerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const [loadError, setLoadError] = useState(false)

  const urlType  = classifyVideoUrl(rawVideoUrl)
  const embedUrl =
    urlType === 'youtube' ? toYoutubeEmbedUrl(rawVideoUrl) :
    urlType === 'vimeo'   ? toVimeoEmbedUrl(rawVideoUrl)   :
    null

  // Progress tracking — only for direct HTML5 video
  useEffect(() => {
    const video = videoRef.current
    if (!video || urlType !== 'direct') return

    setLoadError(false)

    const interval = setInterval(() => {
      if (!video.paused && video.currentTime > 0) {
        updateWatchedSeconds(lessonId, Math.floor(video.currentTime))
      }
    }, 10000)

    function onEnded() { markLessonCompleted(lessonId) }
    video.addEventListener('ended', onEnded)

    return () => {
      clearInterval(interval)
      video.removeEventListener('ended', onEnded)
    }
  }, [lessonId, streamUrl, urlType])

  function handleContextMenu(e: React.MouseEvent) {
    if (isProtected) e.preventDefault()
  }

  if (loadError) return <ErrorState onRetry={() => setLoadError(false)} />

  /* ── YouTube / Vimeo → iframe embed ─────────────────────────────────────── */
  if (embedUrl) {
    return (
      <div
        className="video-wrapper relative bg-black rounded-2xl overflow-hidden aspect-video"
        onContextMenu={handleContextMenu}
      >
        <iframe
          src={embedUrl}
          title="Vidéo de la leçon"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={!isProtected}
          className="absolute inset-0 w-full h-full border-0"
        />
        {isProtected && watermarkText && <Watermark text={watermarkText} />}
      </div>
    )
  }

  /* ── Direct / Supabase Storage → HTML5 video via stream API ─────────────── */
  return (
    <div
      className="video-wrapper relative bg-black rounded-2xl overflow-hidden aspect-video"
      onContextMenu={handleContextMenu}
    >
      <video
        ref={videoRef}
        key={streamUrl}
        src={streamUrl}
        controls
        playsInline
        controlsList={isProtected ? 'nodownload nofullscreen noremoteplayback' : 'nodownload'}
        disablePictureInPicture={isProtected}
        className="w-full h-full"
        onError={() => setLoadError(true)}
      />
      {isProtected && watermarkText && <Watermark text={watermarkText} />}
    </div>
  )
}
