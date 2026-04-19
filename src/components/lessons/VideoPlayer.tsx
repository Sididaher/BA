'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { updateWatchedSeconds, markLessonCompleted } from '@/actions/progress'
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'
import {
  classifyVideoUrl, toYoutubeEmbedUrl, toVimeoEmbedUrl,
} from '@/lib/utils'

interface VideoPlayerProps {
  streamUrl:     string
  rawVideoUrl:   string
  lessonId:      string
  isProtected:   boolean
  watermarkText?: string
}

// ── Watermark positions — 8 distinct screen zones ────────────────────────────

type WmPos = { top: string; left: string }

const WM_POSITIONS: WmPos[] = [
  { top: '7%',  left: '4%'  },
  { top: '7%',  left: '64%' },
  { top: '40%', left: '4%'  },
  { top: '40%', left: '64%' },
  { top: '74%', left: '4%'  },
  { top: '74%', left: '64%' },
  { top: '26%', left: '34%' },
  { top: '58%', left: '34%' },
]

// ── Telemetry thresholds ─────────────────────────────────────────────────────

const SEEK_WINDOW_MS  = 10_000  // 10-second rolling window
const SEEK_THRESHOLD  = 6       // >6 seeks in window → abuse signal

// ── Helpers ──────────────────────────────────────────────────────────────────

async function reportEvent(
  lessonId:  string,
  eventType: string,
  metadata:  Record<string, unknown> = {},
) {
  try {
    await fetch('/api/video-event', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lesson_id: lessonId, event_type: eventType, metadata }),
    })
  } catch {
    // Telemetry must never interrupt playback — swallow silently
  }
}

// ── Moving watermark ─────────────────────────────────────────────────────────

function MovingWatermark({ text }: { text: string }) {
  const [posIdx,  setPosIdx]  = useState(() => Math.floor(Math.random() * WM_POSITIONS.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out → move → fade in
      setVisible(false)
      const move = setTimeout(() => {
        setPosIdx(i => (i + 1 + Math.floor(Math.random() * 3)) % WM_POSITIONS.length)
        setVisible(true)
      }, 500)
      return () => clearTimeout(move)
    }, 8_000)
    return () => clearInterval(timer)
  }, [])

  const pos = WM_POSITIONS[posIdx]

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      aria-hidden
      style={{ zIndex: 10 }}
    >
      <span
        style={{
          position:        'absolute',
          top:             pos.top,
          left:            pos.left,
          opacity:         visible ? 0.30 : 0,
          transition:      'opacity 500ms ease',
          color:           'white',
          fontSize:        'clamp(9px, 1.8vw, 12px)',
          fontWeight:      700,
          fontFamily:      'monospace',
          letterSpacing:   '0.05em',
          textShadow:      '0 1px 5px rgba(0,0,0,0.95)',
          whiteSpace:      'nowrap',
          userSelect:      'none',
          WebkitUserSelect: 'none',
        }}
      >
        {text}
      </span>
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

export default function VideoPlayer({
  streamUrl,
  rawVideoUrl,
  lessonId,
  isProtected,
  watermarkText,
}: VideoPlayerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const seekTimes = useRef<number[]>([])
  const [loadError, setLoadError] = useState(false)

  const urlType  = classifyVideoUrl(rawVideoUrl)
  const embedUrl =
    urlType === 'youtube' ? toYoutubeEmbedUrl(rawVideoUrl) :
    urlType === 'vimeo'   ? toVimeoEmbedUrl(rawVideoUrl)   :
    null
  // HLS and direct both play via the HTML5 <video> element through the stream route
  const isNativeVideo = urlType === 'direct' || urlType === 'hls'

  // ── Progress tracking + playback telemetry (native video only) ──────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isNativeVideo) return
    setLoadError(false)

    let startedReported = false

    function onPlay() {
      if (!startedReported) {
        startedReported = true
        reportEvent(lessonId, 'playback_started', { currentTime: video!.currentTime })
      }
    }

    const interval = setInterval(() => {
      if (!video.paused && video.currentTime > 0) {
        updateWatchedSeconds(lessonId, Math.floor(video.currentTime))
      }
    }, 10_000)

    function onEnded() {
      markLessonCompleted(lessonId)
      reportEvent(lessonId, 'playback_completed', { duration: video!.duration })
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('ended', onEnded)

    return () => {
      clearInterval(interval)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('ended', onEnded)
    }
  }, [lessonId, streamUrl, isNativeVideo])

  // ── Tab-visibility logging ────────────────────────────────────────────────
  useEffect(() => {
    if (!isNativeVideo) return
    function onVisibility() {
      if (document.hidden) {
        reportEvent(lessonId, 'tab_hidden', {
          currentTime: videoRef.current?.currentTime ?? 0,
        })
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [lessonId, isNativeVideo])

  // ── Seek-abuse detection ──────────────────────────────────────────────────
  const handleSeeked = useCallback(() => {
    const now = Date.now()
    // Keep only events inside the rolling window
    seekTimes.current = seekTimes.current.filter(t => now - t < SEEK_WINDOW_MS)
    seekTimes.current.push(now)
    if (seekTimes.current.length >= SEEK_THRESHOLD) {
      reportEvent(lessonId, 'seek_abuse', {
        seekCount:   seekTimes.current.length,
        windowMs:    SEEK_WINDOW_MS,
      })
      seekTimes.current = []
    }
  }, [lessonId])

  function handleContextMenu(e: React.MouseEvent) {
    if (isProtected) e.preventDefault()
  }

  if (loadError) return <ErrorState onRetry={() => setLoadError(false)} />

  // ── YouTube / Vimeo → iframe embed ───────────────────────────────────────
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
        {isProtected && watermarkText && <MovingWatermark text={watermarkText} />}
      </div>
    )
  }

  // ── Direct / Supabase Storage → HTML5 video via stream API ───────────────
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
        onSeeked={handleSeeked}
      />
      {isProtected && watermarkText && <MovingWatermark text={watermarkText} />}
    </div>
  )
}
