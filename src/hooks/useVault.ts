'use client'

import { useBalance, useReadContract, useReadContracts } from 'wagmi'
import { PORTALDOT_CHAIN_ID, SWITCH_ABI, SWITCH_ADDRESS, SWITCH_CONFIGURED } from '@/lib/contract'

export function useVault(id: bigint | undefined) {
  return useReadContract({
    address: SWITCH_ADDRESS,
    abi: SWITCH_ABI,
    functionName: 'getVault',
    args: id !== undefined ? [id] : undefined,
    chainId: PORTALDOT_CHAIN_ID,
    query: { enabled: SWITCH_CONFIGURED && id !== undefined, refetchInterval: 10_000 },
  })
}

export function useVaultDeadline(id: bigint | undefined) {
  return useReadContract({
    address: SWITCH_ADDRESS,
    abi: SWITCH_ABI,
    functionName: 'deadline',
    args: id !== undefined ? [id] : undefined,
    chainId: PORTALDOT_CHAIN_ID,
    query: { enabled: SWITCH_CONFIGURED && id !== undefined, refetchInterval: 10_000 },
  })
}

export function useOwnerVaults(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: SWITCH_ADDRESS,
    abi: SWITCH_ABI,
    functionName: 'vaultsOfOwner',
    args: owner ? [owner] : undefined,
    chainId: PORTALDOT_CHAIN_ID,
    query: { enabled: SWITCH_CONFIGURED && !!owner, refetchInterval: 15_000 },
  })
}

export function useBeneficiaryVaults(addr: `0x${string}` | undefined) {
  return useReadContract({
    address: SWITCH_ADDRESS,
    abi: SWITCH_ABI,
    functionName: 'vaultsOfBeneficiary',
    args: addr ? [addr] : undefined,
    chainId: PORTALDOT_CHAIN_ID,
    query: { enabled: SWITCH_CONFIGURED && !!addr, refetchInterval: 15_000 },
  })
}

export function useNextVaultId() {
  return useReadContract({
    address: SWITCH_ADDRESS,
    abi: SWITCH_ABI,
    functionName: 'nextVaultId',
    chainId: PORTALDOT_CHAIN_ID,
    query: { enabled: SWITCH_CONFIGURED, refetchInterval: 15_000 },
  })
}

export function useMinWindow() {
  return useReadContract({
    address: SWITCH_ADDRESS,
    abi: SWITCH_ABI,
    functionName: 'minWindow',
    chainId: PORTALDOT_CHAIN_ID,
    query: { enabled: SWITCH_CONFIGURED },
  })
}

export function useVaults(ids: bigint[]) {
  return useReadContracts({
    contracts: ids.map((id) => ({
      address: SWITCH_ADDRESS,
      abi: SWITCH_ABI,
      functionName: 'getVault' as const,
      args: [id] as const,
      chainId: PORTALDOT_CHAIN_ID,
    })),
    query: { enabled: SWITCH_CONFIGURED && ids.length > 0, refetchInterval: 15_000 },
  })
}

export function usePotBalance(address: `0x${string}` | undefined) {
  return useBalance({
    address,
    chainId: PORTALDOT_CHAIN_ID,
    query: { enabled: !!address, refetchInterval: 15_000 },
  })
}
