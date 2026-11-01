import { defineChain, formatEther, isAddress, parseEther } from 'viem'

export const PORTALDOT_CHAIN_ID = 420420777
export const GRACE_PERIOD_SECONDS = 7 * 24 * 60 * 60
const PORTALDOT_RPC_URL = process.env.NEXT_PUBLIC_EVM_RPC?.trim() || 'https://test-evm-rpc-v3.portaldot.dev'

export const PORTALDOT_V3_TESTNET = defineChain({
  id: PORTALDOT_CHAIN_ID,
  name: 'Portaldot V3 Testnet',
  nativeCurrency: { name: 'POT', symbol: 'POT', decimals: 18 },
  rpcUrls: { default: { http: [PORTALDOT_RPC_URL] } },
  blockExplorers: {
    default: { name: 'Portaldot Scanner', url: 'https://scanner-testnet-v3.portaldot.dev' },
  },
  testnet: true,
})

const UNDEPLOYED_ADDRESS = '0x0000000000000000000000000000000000000000'
const configuredAddress = process.env.NEXT_PUBLIC_SWITCH_ADDRESS?.trim()
const addressConfigured =
  isAddress(configuredAddress || '', { strict: false }) &&
  configuredAddress?.toLowerCase() !== UNDEPLOYED_ADDRESS

export const SWITCH_ADDRESS = (addressConfigured ? configuredAddress : UNDEPLOYED_ADDRESS) as `0x${string}`
export const SWITCH_CONFIGURED = Boolean(addressConfigured)

export const SWITCH_ABI = [
  // Write
  {
    name: 'createVault',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'name_', type: 'bytes32' },
      { name: 'beneficiaries_', type: 'address[]' },
      { name: 'shares_', type: 'uint16[]' },
      { name: 'window_', type: 'uint256' },
    ],
    outputs: [{ name: 'id', type: 'uint256' }],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'checkIn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'setBeneficiaries',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'beneficiaries_', type: 'address[]' },
      { name: 'shares_', type: 'uint16[]' },
    ],
    outputs: [],
  },
  {
    name: 'close',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'release',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'index', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  // Views
  {
    name: 'getVault',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'name', type: 'bytes32' },
      { name: 'window', type: 'uint256' },
      { name: 'lastCheckIn', type: 'uint256' },
      { name: 'balance', type: 'uint256' },
      { name: 'releasedBalance', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'beneficiaryAddrs', type: 'address[]' },
      { name: 'beneficiaryShares', type: 'uint16[]' },
    ],
  },
  {
    name: 'deadline',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'warningAt',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'GRACE_PERIOD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'isExpired',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'shareOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'beneficiary', type: 'address' }],
    outputs: [{ name: '', type: 'uint16' }],
  },
  {
    name: 'vaultsOfOwner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'vaultsOfBeneficiary',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'beneficiary', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'claimedAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'index', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'nextVaultId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'minWindow',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// Vault status enum
export enum VaultStatus {
  None = 0,
  Active = 1,
  Released = 2,
  Closed = 3,
}

export function statusLabel(s: number) {
  return ['None', 'Active', 'Released', 'Closed'][s] ?? 'Unknown'
}

export function parsePot(amount: string): bigint {
  try {
    return amount.trim() ? parseEther(amount) : 0n
  } catch {
    return 0n
  }
}

export function formatPot(raw: bigint): string {
  const [whole, fraction = ''] = formatEther(raw).split('.')
  const decimals = fraction.slice(0, 4).padEnd(2, '0').replace(/0+$/, '')
  return `${BigInt(whole).toLocaleString('en-US')}.${decimals || '00'}`
}

export function payoutForBeneficiary(releasedBalance: bigint, shares: readonly number[], index: number): bigint {
  const share = shares[index]
  if (share === undefined || index < 0) return 0n
  if (index === shares.length - 1) {
    const precedingPayouts = shares.slice(0, -1).reduce(
      (total, precedingShare) => total + (releasedBalance * BigInt(precedingShare)) / 10_000n,
      0n,
    )
    return releasedBalance - precedingPayouts
  }
  return (releasedBalance * BigInt(share)) / 10_000n
}

export function isValidAddress(address: string): address is `0x${string}` {
  return isAddress(address, { strict: false })
}

export function formatDuration(seconds: bigint | number): string {
  const s = Number(seconds)
  if (s >= 86400) return `${Math.round(s / 86400)} day${Math.round(s / 86400) !== 1 ? 's' : ''}`
  if (s >= 3600) return `${Math.round(s / 3600)} hour${Math.round(s / 3600) !== 1 ? 's' : ''}`
  return `${Math.round(s / 60)} min`
}

export function formatCountdown(remaining: number): string {
  if (remaining <= 0) return 'Expired'
  const d = Math.floor(remaining / 86400)
  const h = Math.floor((remaining % 86400) / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${remaining % 60}s`
}

export function decodeBytes32Name(hex: string): string {
  try {
    const bytes = Uint8Array.from(hex.slice(2).match(/.{1,2}/g) ?? [], (byte) => Number.parseInt(byte, 16))
    const end = bytes.indexOf(0)
    return new TextDecoder().decode(end >= 0 ? bytes.slice(0, end) : bytes).trim()
  } catch {
    return hex
  }
}

export function encodeBytes32Name(name: string): `0x${string}` {
  const bytes = new TextEncoder().encode(name)
  if (bytes.length > 32) throw new Error('Vault name must be 32 bytes or fewer')
  const padded = new Uint8Array(32)
  padded.set(bytes)
  return `0x${Array.from(padded, (byte) => byte.toString(16).padStart(2, '0')).join('')}` as `0x${string}`
}

export function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function explorerTx(hash: string) {
  return `https://scanner-testnet-v3.portaldot.dev/tx/${hash}`
}

export function explorerAddr(addr: string) {
  return `https://scanner-testnet-v3.portaldot.dev/address/${addr}`
}
