import { ImageResponse } from 'next/og'

export function generateImageMetadata() {
  return [
    { id: '32',  contentType: 'image/png' as const, size: { width: 32,  height: 32  } },
    { id: '192', contentType: 'image/png' as const, size: { width: 192, height: 192 } },
    { id: '512', contentType: 'image/png' as const, size: { width: 512, height: 512 } },
  ]
}

export default function Icon({ id }: { id: string }) {
  const sizeMap: Record<string, number> = { '32': 32, '192': 192, '512': 512 }
  const size   = sizeMap[id] ?? 192
  const inner  = Math.round(size * 0.60)
  const radius = Math.round(size * 0.22)

  return new ImageResponse(
    (
      <div
        style={{
          display:         'flex',
          width:           size,
          height:          size,
          background:      'linear-gradient(145deg, #3B82F6 0%, #2563EB 100%)',
          borderRadius:    radius,
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 10v6" />
          <path d="M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  )
}
