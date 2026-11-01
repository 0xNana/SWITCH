import { serve } from 'bun'
import { createPublicClient, http, isAddress, verifyMessage } from 'viem'
import {
  getBeneficiaryEmail,
  removeBeneficiaryEmail,
  upsertBeneficiaryEmail,
} from './db'
import { startIndexer } from './indexer'
import { sendRegistrationEmail } from './mailer'
import {
  getPublicRpcUrl,
  PORTALDOT_CHAIN_ID,
  PORTALDOT_V3_TESTNET,
  SWITCH_ABI,
  SWITCH_ADDRESS,
  SWITCH_CONFIGURED,
} from './contract-config'

const PORT = Number(process.env.NOTIFICATION_SERVER_PORT ?? 3001)
const MAX_UINT256 = (1n << 256n) - 1n
const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)
if (process.env.NODE_ENV !== 'production') {
  configuredOrigins.push('http://localhost:5173', 'http://localhost:3000')
}
const allowedOrigins = new Set(configuredOrigins)

const rpcClient = createPublicClient({
  chain: PORTALDOT_V3_TESTNET,
  transport: http(getPublicRpcUrl()),
})

function responseHeaders(origin: string | null) {
  const headers = new Headers({ 'Content-Type': 'application/json', Vary: 'Origin' })
  if (origin && allowedOrigins.has(origin)) headers.set('Access-Control-Allow-Origin', origin)
  return headers
}

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), { status, headers: responseHeaders(origin) })
}

function err(message: string, status = 400, origin: string | null = null) {
  return json({ error: message }, status, origin)
}

function emailSignatureMessage(
  action: 'register' | 'unregister' | 'owner-register' | 'owner-unregister',
  vaultId: string,
  account: string,
  email?: string,
) {
  return `SWITCH_EMAIL_V1:${PORTALDOT_CHAIN_ID}:${action}:${vaultId}:${account.toLowerCase()}:${email?.trim().toLowerCase() ?? ''}`
}

function isVaultId(value: string): boolean {
  if (!/^(0|[1-9]\d{0,77})$/.test(value)) return false
  try { return BigInt(value) <= MAX_UINT256 } catch { return false }
}

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function verifyEmailSignature(
  action: 'register' | 'unregister' | 'owner-register' | 'owner-unregister',
  vaultId: string,
  account: string,
  signature: string,
  email?: string,
) {
  try {
    return await verifyMessage({
      address: account as `0x${string}`,
      message: emailSignatureMessage(action, vaultId, account, email),
      signature: signature as `0x${string}`,
    })
  } catch {
    return false
  }
}

async function getVault(vaultId: string): Promise<readonly unknown[] | null> {
  if (!SWITCH_CONFIGURED || !isVaultId(vaultId)) return null
  try {
    return await rpcClient.readContract({
      address: SWITCH_ADDRESS,
      abi: SWITCH_ABI,
      functionName: 'getVault',
      args: [BigInt(vaultId)],
    }) as readonly unknown[]
  } catch {
    return null
  }
}

async function handleRequest(req: Request): Promise<Response> {
  const origin = req.headers.get('origin')
  if (origin && !allowedOrigins.has(origin)) return err('Origin not allowed', 403)

  if (req.method === 'OPTIONS') {
    const headers = responseHeaders(origin)
    headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type')
    headers.set('Access-Control-Max-Age', '600')
    return new Response(null, { status: 204, headers })
  }

  const { pathname } = new URL(req.url)
  const method = req.method

  if (method === 'GET' && pathname === '/health') {
    return json({ ok: true, ts: Date.now(), chainId: PORTALDOT_CHAIN_ID, switchConfigured: SWITCH_CONFIGURED }, 200, origin)
  }

  if (method === 'GET' && (pathname.startsWith('/emails/') || pathname.startsWith('/owner-email/'))) {
    const match = pathname.match(/^\/(emails|owner-email)\/([^/]+)\/([^/]+)$/)
    if (!match) return err('Invalid email status path', 400, origin)
    const [, , vaultId, account] = match
    if (!isVaultId(vaultId) || !isAddress(account, { strict: false })) return err('Invalid vault or account', 400, origin)
    const savedEmail = getBeneficiaryEmail(vaultId, account)
    return json({ registered: savedEmail !== null }, 200, origin)
  }

  if (method === 'POST' && (pathname === '/emails' || pathname === '/owner-email')) {
    let body: { vaultId?: string; beneficiary?: string; owner?: string; email?: string; signature?: string }
    try { body = await req.json() } catch { return err('Invalid JSON', 400, origin) }

    const isOwnerEmail = pathname === '/owner-email'
    const account = isOwnerEmail ? body.owner : body.beneficiary
    const { vaultId, email, signature } = body
    if (!vaultId || !account || !email || !signature) return err('Missing fields', 400, origin)
    if (typeof vaultId !== 'string' || typeof account !== 'string' || !isVaultId(vaultId) || !isAddress(account, { strict: false })) {
      return err('Invalid vault or account', 400, origin)
    }
    if (!isEmail(email)) return err('Invalid email', 400, origin)
    if (!SWITCH_CONFIGURED) return err('SWITCH contract is not configured', 503, origin)

    const action = isOwnerEmail ? 'owner-register' : 'register'
    if (!await verifyEmailSignature(action, vaultId, account, signature, email)) {
      return err('Invalid signature', 403, origin)
    }

    const vault = await getVault(vaultId)
    if (!vault) return err('Vault not found on Portaldot V3 Testnet', 404, origin)
    const onchainOwner = String(vault[0]).toLowerCase()
    const status = Number(vault[6])

    if (isOwnerEmail) {
      if (onchainOwner !== account.toLowerCase()) return err('Not the vault owner', 403, origin)
    } else {
      if (status !== 1) return err('Email reminders are only available for active vaults', 409, origin)
      const beneficiaryAddrs = vault[7] as string[]
      if (!beneficiaryAddrs.some((beneficiary) => beneficiary.toLowerCase() === account.toLowerCase())) {
        return err('This account is not a named beneficiary', 403, origin)
      }
    }

    upsertBeneficiaryEmail(vaultId, account, email.trim())

    if (!isOwnerEmail) {
      const vaultName = decodeBytes32Name(vault[1] as string) || `Vault #${vaultId}`
      const beneficiaryAddrs = vault[7] as string[]
      const beneficiaryShares = vault[8] as number[]
      const index = beneficiaryAddrs.findIndex((beneficiary) => beneficiary.toLowerCase() === account.toLowerCase())
      const sharePercent = ((beneficiaryShares[index] ?? 0) / 100).toFixed(1)
      void sendRegistrationEmail({
        to: email.trim(),
        beneficiaryAddress: account,
        vaultId,
        vaultName,
        ownerAddress: onchainOwner,
        sharePercent,
      }).catch((error) => console.error('[server] registration email failed:', error))
    }

    return json({ ok: true }, 200, origin)
  }

  if (method === 'DELETE' && (pathname === '/emails' || pathname === '/owner-email')) {
    let body: { vaultId?: string; beneficiary?: string; owner?: string; signature?: string }
    try { body = await req.json() } catch { return err('Invalid JSON', 400, origin) }

    const isOwnerEmail = pathname === '/owner-email'
    const account = isOwnerEmail ? body.owner : body.beneficiary
    const { vaultId, signature } = body
    if (!vaultId || !account || !signature) return err('Missing fields', 400, origin)
    if (typeof vaultId !== 'string' || typeof account !== 'string' || !isVaultId(vaultId) || !isAddress(account, { strict: false })) {
      return err('Invalid vault or account', 400, origin)
    }

    const action = isOwnerEmail ? 'owner-unregister' : 'unregister'
    if (!await verifyEmailSignature(action, vaultId, account, signature)) {
      return err('Invalid signature', 403, origin)
    }

    if (isOwnerEmail) {
      const vault = await getVault(vaultId)
      if (!vault || String(vault[0]).toLowerCase() !== account.toLowerCase()) {
        return err('Not the vault owner', 403, origin)
      }
    }

    removeBeneficiaryEmail(vaultId, account)
    return json({ ok: true }, 200, origin)
  }

  return err('Not found', 404, origin)
}

function decodeBytes32Name(hex: string): string {
  try {
    const bytes = Uint8Array.from(hex.replace(/^0x/, '').match(/.{1,2}/g) ?? [], (byte) => Number.parseInt(byte, 16))
    const end = bytes.indexOf(0)
    return new TextDecoder().decode(end >= 0 ? bytes.slice(0, end) : bytes).trim()
  } catch {
    return ''
  }
}

serve({ port: PORT, fetch: handleRequest })
console.log(`[server] SWITCH notification backend listening on :${PORT}`)

startIndexer().catch((error) => {
  console.error('[server] indexer startup failed:', error)
})
