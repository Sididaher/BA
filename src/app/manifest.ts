import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'BA',
    short_name:       'BA',
    description:      'Plateforme de préparation au Baccalauréat',
    start_url:        '/',
    display:          'standalone',
    orientation:      'portrait',
    background_color: '#F8FAFF',
    theme_color:      '#3B82F6',
    icons: [
      {
        src:   '/icon?id=192',
        sizes: '192x192',
        type:  'image/png',
      },
      {
        src:     '/icon?id=512',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
