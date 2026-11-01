/**
 * server/indexer.ts — Portaldot V3 chain watcher
 *
 * Polls for SWITCH contract events:
 *   Released(id, balance, timestamp) → email all beneficiaries with registered emails
 *
 * Deadline warnings: owner emails (registered via /api/owner-email) sent at 24h and 4h.
 *
 * Runs in the SAME process as the API server (one SQLite writer — docker skill rule).
 *
 * INDEXER COLD START: never crawl from block 0. Start from (head - LOOKBACK).
 * Full history is not needed: Released events are permanent on-chain; the vault
 * status is always readable via getVault(). LOOKBACK covers recent vaults only.
 */

import { createPublicClient, formatEther, http, parseAbiItem } from 'viem'
import {
  getVaultEmails,
  getBeneficiaryEmail,
  hasNotificationBeenSent,
  recordNotificationSent,
  getIndexerLastBlock,
  setIndexerLastBlock,
} from './db'
import { sendReleaseEmail, sendDeadlineWarningEmail } from './mailer'
import {
  PORTALDOT_CHAIN_ID,
  PORTALDOT_V3_TESTNET,
  SWITCH_ABI,
  SWITCH_ADDRESS,
  SWITCH_CONFIGURED,
  getPublicRpcUrl,
} from './contract-config'

// ── RPC setup ─────────────────────────────────────────────────────────────────

const rpcUrl = getPublicRpcUrl()

const client = createPublicClient({
  chain: PORTALDOT_V3_TESTNET,
  transport: http(rpcUrl),
})

const BATCH_SIZE = 2000n  // blocks per getLogs call
const LOOKBACK  = 5000n   // cold-start lookback (recent vaults only — not full history)
const POLL_MS   = 15_000  // 15 s poll interval

// ── Event ABIs ────────────────────────────────────────────────────────────────

const releasedAbi = parseAbiItem(
  'event Released(uint256 indexed id, uint256 balance, uint256 timestamp)'
)

// ── Main poll loop ────────────────────────────────────────────────────────────

export async function startIndexer() {
  if (!SWITCH_CONFIGURED) {
    console.warn('[indexer] SWITCH_ADDRESS is not configured; chain notifications are paused')
    return
  }

  console.log('[indexer] starting on Portaldot V3 Testnet', PORTALDOT_CHAIN_ID, '— rpc:', rpcUrl)

  const head = await client.getBlockNumber()
  const stored = getIndexerLastBlock(PORTALDOT_CHAIN_ID)
  const startBlock = stored > 0
    ? BigInt(stored) + 1n
    : head > LOOKBACK ? head - LOOKBACK : 0n

  console.log(`[indexer] head=${head} stored=${stored} starting from block ${startBlock}`)

  let fromBlock = startBlock

  async function poll() {
    try {
      const currentHead = await client.getBlockNumber()
      if (fromBlock > currentHead) return

      const batchFrom = fromBlock
      const toBlock = batchFrom + BATCH_SIZE - 1n < currentHead
        ? batchFrom + BATCH_SIZE - 1n
        : currentHead

      const released = await client.getLogs({
        address: SWITCH_ADDRESS,
        event: releasedAbi,
        fromBlock: batchFrom,
        toBlock,
      })

      for (const log of released) {
        if (log.args.id !== undefined && log.args.balance !== undefined) {
          await handleReleased(log.args.id, log.args.balance)
        }
      }

      setIndexerLastBlock(PORTALDOT_CHAIN_ID, Number(toBlock))
      fromBlock = toBlock + 1n

      if (released.length > 0) {
        console.log(`[indexer] blocks ${batchFrom}-${toBlock}: ${released.length} Released events`)
      }
    } catch (err) {
      console.error('[indexer] poll error:', err instanceof Error ? err.message : err)
    }
  }

  await poll()
  setInterval(poll, POLL_MS)
  setInterval(checkDeadlineWarnings, 60 * 60 * 1000)
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleReleased(vaultId: bigint, _balance: bigint) {
  const id = vaultId.toString()
  console.log(`[indexer] Released vault #${id}`)

  let vaultData: readonly unknown[] | null = null
  try {
    vaultData = await client.readContract({
      address: SWITCH_ADDRESS,
      abi: SWITCH_ABI,
      functionName: 'getVault',
      args: [vaultId],
    }) as readonly unknown[]
  } catch (err) {
    console.error(`[indexer] getVault(${id}) failed:`, err instanceof Error ? err.message : err)
    return
  }

  const releasedBalance = vaultData[5] as bigint
  const beneficiaryAddrs = vaultData[7] as string[]
  const beneficiaryShares = vaultData[8] as number[]
  const vaultName = decodeBytes32Name(vaultData[1] as string) || `Vault #${id}`

  for (let i = 0; i < beneficiaryAddrs.length; i++) {
    const addr = beneficiaryAddrs[i]
    const share = beneficiaryShares[i]
    const email = getBeneficiaryEmail(id, addr)
    if (!email) continue

    const eventType = 'released'
    if (hasNotificationBeenSent(id, eventType, addr)) continue

    const payoutRaw = i === beneficiaryAddrs.length - 1
      ? BigInt(releasedBalance) - beneficiaryShares.slice(0, -1).reduce(
          (sum, previousShare) => sum + (BigInt(releasedBalance) * BigInt(previousShare)) / 10_000n,
          0n,
        )
      : (BigInt(releasedBalance) * BigInt(share)) / 10_000n
    const payoutPot = formatPot(payoutRaw)
    const sharePercent = (share / 100).toFixed(1)

    try {
      await sendReleaseEmail({ to: email, vaultId: id, vaultName, sharePercent, payoutPot })
      recordNotificationSent(id, eventType, addr)
      console.log(`[indexer] sent release email to ${email} for vault #${id}`)
    } catch (err) {
      console.error(`[indexer] email failed for ${email}:`, err instanceof Error ? err.message : err)
    }
  }
}

async function checkDeadlineWarnings() {
  try {
    const nextId = await client.readContract({
      address: SWITCH_ADDRESS,
      abi: SWITCH_ABI,
      functionName: 'nextVaultId',
    }) as bigint

    // Only scan vaults with registered emails — limit to 500 most recent
    const limit = nextId > 500n ? nextId - 500n : 0n
    for (let id = nextId - 1n; id >= limit; id--) {
      await checkOneVaultDeadline(id)
    }
  } catch (err) {
    console.error('[indexer] deadline check error:', err instanceof Error ? err.message : err)
  }
}

async function checkOneVaultDeadline(vaultId: bigint) {
  const id = vaultId.toString()
  const emails = getVaultEmails(id)
  if (emails.length === 0) return

  let vaultData: readonly unknown[] | null = null
  try {
    vaultData = await client.readContract({
      address: SWITCH_ADDRESS,
      abi: SWITCH_ABI,
      functionName: 'getVault',
      args: [vaultId],
    }) as readonly unknown[]
  } catch { return }

  const owner = vaultData[0] as string
  const status = vaultData[6] as number
  const lastCheckIn = vaultData[3] as bigint
  if (status !== 1) return // not Active

  let warningAt: bigint
  try {
    warningAt = await client.readContract({
      address: SWITCH_ADDRESS,
      abi: SWITCH_ABI,
      functionName: 'warningAt',
      args: [vaultId],
    }) as bigint
  } catch { return }

  const nowSecs = BigInt(Math.floor(Date.now() / 1000))
  const secsLeft = Number(warningAt) - Number(nowSecs)
  const hoursLeft = Math.floor(secsLeft / 3600)

  const warnAt = [24, 4]
  for (const h of warnAt) {
    if (hoursLeft <= h && hoursLeft > 0) {
      const eventType = `deadline_warning_${lastCheckIn}_${h}h`
      const ownerEmail = getBeneficiaryEmail(id, owner)
      if (!ownerEmail || hasNotificationBeenSent(id, eventType, owner)) continue

      const vaultName = decodeBytes32Name(vaultData[1] as string) || `Vault #${id}`
      try {
        await sendDeadlineWarningEmail({ to: ownerEmail, vaultId: id, vaultName, hoursLeft })
        recordNotificationSent(id, eventType, owner)
        console.log(`[indexer] sent ${h}h warning to ${ownerEmail} for vault #${id}`)
      } catch (err) {
        console.error('[indexer] warning email failed:', err instanceof Error ? err.message : err)
      }
    }
  }
}

function decodeBytes32Name(hex: string): string {
  try {
    const bytes = Buffer.from(hex.replace(/^0x/, ''), 'hex')
    return bytes.toString('utf8').replace(/\0/g, '').trim()
  } catch {
    return ''
  }
}

function formatPot(amount: bigint) {
  const [whole, fraction = ''] = formatEther(amount).split('.')
  const decimals = fraction.slice(0, 4).padEnd(2, '0').replace(/0+$/, '')
  return `${BigInt(whole).toLocaleString('en-US')}.${decimals || '00'}`
}
