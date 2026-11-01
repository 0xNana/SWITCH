'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { PORTALDOT_CHAIN_ID } from '@/lib/contract'

export function useChainGuard() {
  const { chainId, isConnected } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const wrongChain = isConnected && chainId !== PORTALDOT_CHAIN_ID

  function ensureChain() {
    if (wrongChain) {
      switchChain({ chainId: PORTALDOT_CHAIN_ID })
      return false
    }
    return true
  }

  return { wrongChain, isSwitching: isPending, ensureChain, isConnected }
}
