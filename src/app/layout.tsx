import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'SWITCH — A POT Safety Vault on Portaldot',
  description:
    'Set aside POT for your beneficiaries. Check in periodically; if you miss a check-in, a safety grace period gives you time to recover before release becomes available.',
  openGraph: {
    title: 'SWITCH — a plan for your Portaldot assets',
    description:
      'A self-custody POT vault on Portaldot V3 with scheduled check-ins, a recovery grace period, and permissionless beneficiary claims.',
    type: 'website',
    siteName: 'SWITCH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SWITCH — a plan for your Portaldot assets',
    description:
      'A self-custody POT vault on Portaldot V3 with scheduled check-ins, a recovery grace period, and permissionless beneficiary claims.',
  },
  icons: { icon: [{ url: '/logo.svg', type: 'image/svg+xml' }] },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
