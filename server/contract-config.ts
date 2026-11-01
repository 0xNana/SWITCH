import { defineChain, isAddress } from 'viem'

export const PORTALDOT_CHAIN_ID = 420420777
const configuredChainId = Number(process.env.CHAIN_ID ?? PORTALDOT_CHAIN_ID)

if (configuredChainId !== PORTALDOT_CHAIN_ID) {
  throw new Error(`SWITCH supports Portaldot V3 Testnet (${PORTALDOT_CHAIN_ID}); received CHAIN_ID=${configuredChainId}`)
}

const rpcUrl = process.env.EVM_RPC?.trim() || 'https://test-evm-rpc-v3.portaldot.dev'
const explorerUrl = process.env.EXPLORER_URL?.trim() || 'https://scanner-testnet-v3.portaldot.dev'
const unsetAddress = '0x0000000000000000000000000000000000000000'
const configuredAddress = process.env.SWITCH_ADDRESS?.trim()

export const SWITCH_ADDRESS = (isAddress(configuredAddress || '', { strict: false })
  ? configuredAddress
  : unsetAddress) as `0x${string}`
export const SWITCH_CONFIGURED = SWITCH_ADDRESS.toLowerCase() !== unsetAddress

export const PORTALDOT_V3_TESTNET = defineChain({
  id: PORTALDOT_CHAIN_ID,
  name: 'Portaldot V3 Testnet',
  nativeCurrency: { name: 'POT', symbol: 'POT', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: { default: { name: 'Portaldot Scanner', url: explorerUrl } },
  testnet: true,
})

export function getPublicRpcUrl() {
  return rpcUrl
}

export const SWITCH_ABI = [
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
    name: 'nextVaultId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
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
    type: 'event',
    name: 'Released',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: false, name: 'balance', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
  },
] as const
