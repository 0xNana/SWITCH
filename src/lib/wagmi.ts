'use client'

import { createConfig, http } from 'wagmi'
import { PORTALDOT_V3_TESTNET } from './contract'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [PORTALDOT_V3_TESTNET],
  connectors: [injected()],
  transports: {
    [PORTALDOT_V3_TESTNET.id]: http(),
  },
  ssr: true,
})
