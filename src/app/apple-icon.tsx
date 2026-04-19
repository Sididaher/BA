import { ImageResponse } from 'next/og'

export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display:         'flex',
          width:           180,
          height:          180,
          background:      'linear-gradient(145deg, #3B82F6 0%, #2563EB 100%)',
          borderRadius:    40,
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        <svg
          width={108}
          height={108}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 10v6" />
          <path d="M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      </div>
    ),
    { width: 180, height: 180 },
  )
}
