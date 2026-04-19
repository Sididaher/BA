import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const SIZES: Record<string, number> = { '192': 192, '512': 512 }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: sizeParam } = await params
  const size   = SIZES[sizeParam] ?? 192
  const inner  = Math.round(size * 0.60)
  const radius = Math.round(size * 0.22)

  return new ImageResponse(
    (
      <div
        style={{
          display:        'flex',
          width:          size,
          height:         size,
          background:     'linear-gradient(145deg, #3B82F6 0%, #2563EB 100%)',
          borderRadius:   radius,
          alignItems:     'center',
          justifyContent: 'center',
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
