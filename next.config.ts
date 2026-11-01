import type { NextConfig } from 'next'

// Stub optional imports that are not used by SWITCH's browser app.
const optionalPackageStubs = [
  '@x402/core/client',
  '@x402/core/schemas',
  '@x402/core/server',
  '@x402/evm',
  '@x402/evm/auth-capture/client',
  '@x402/evm/batch-settlement/client',
  '@x402/evm/exact/client',
  '@x402/evm/exact/server',
  '@x402/evm/exact/v1/client',
  '@x402/evm/upto/client',
  '@x402/evm/upto/server',
  '@x402/express',
  '@x402/extensions/bazaar',
  '@x402/extensions/builder-code',
  '@x402/fetch',
  '@x402/svm/exact/client',
  '@x402/svm/exact/server',
  '@x402/svm/exact/v1/client',
  '@x402/svm/upto/client',
  '@x402/svm/upto/server',
  // Native-only storage from MetaMask SDK; injected browser wallets use browser storage.
  '@react-native-async-storage/async-storage',
  // Pino's optional development log formatter.
  'pino-pretty',
]

const nextConfig: NextConfig = {
  async rewrites() {
    const backendPort = process.env.NOTIFICATION_SERVER_PORT ?? '3001'
    const backendUrl = (process.env.NOTIFICATION_SERVER_URL ?? `http://localhost:${backendPort}`).replace(/\/+$/, '')
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Stub optional packages that this browser app does not use.
    const aliases: Record<string, false> = {}
    for (const pkg of optionalPackageStubs) {
      aliases[pkg] = false
    }
    config.resolve.alias = { ...config.resolve.alias, ...aliases }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        worker_threads: false,
      }
    }

    return config
  },
}

export default nextConfig
