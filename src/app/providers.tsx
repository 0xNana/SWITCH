'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { ConnectKitProvider } from 'connectkit'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { wagmiConfig } from '@/lib/wagmi'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="auto"
          customTheme={{
            '--ck-font-family': "-apple-system, 'Helvetica Neue', Arial, sans-serif",
            '--ck-primary-button-background': '#c8902a',
            '--ck-primary-button-hover-background': '#e0a73a',
            '--ck-body-background': '#1a1612',
            '--ck-body-color': '#f5efe4',
            '--ck-border-radius': '16px',
          }}
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif",
                background: '#1a1612',
                border: '1px solid rgba(255,248,238,0.12)',
                color: '#f5efe4',
              },
            }}
          />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
