'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/Card'
import { TxButton } from '@/components/TxButton'
import { Btn } from '@/components/Btn'
import { useChainGuard } from '@/hooks/useChainGuard'
import { usePotBalance, useMinWindow } from '@/hooks/useVault'
import {
  SWITCH_ADDRESS, SWITCH_ABI, SWITCH_CONFIGURED,
  parsePot, formatPot, encodeBytes32Name, formatAddress, isValidAddress,
} from '@/lib/contract'

interface Beneficiary { addr: string; share: string }

const DEFAULT_BEN: Beneficiary = { addr: '', share: '' }

export default function CreatePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { wrongChain, isSwitching, ensureChain } = useChainGuard()
  const { data: potBalance } = usePotBalance(address)
  const { data: minWindow } = useMinWindow()

  const [name, setName] = useState('')
  const [windowDays, setWindowDays] = useState('30')
  const [deposit, setDeposit] = useState('')
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([{ ...DEFAULT_BEN }])
  const [step, setStep] = useState<'idle' | 'creating'>('idle')
  const depositRaw = parsePot(deposit)
  const depositHasValidPrecision = /^\d*(?:\.\d{0,18})?$/.test(deposit)

  // ── Create tx ─────────────────────────────────────────────────────────────
  const {
    writeContract: create,
    data: createHash,
    isPending: createPending,
    error: createError,
    reset: createReset,
  } = useWriteContract()
  const { isLoading: createConfirming, isSuccess: createSuccess } =
    useWaitForTransactionReceipt({ hash: createHash })

  const totalShares = beneficiaries.reduce((s, b) => s + (parseInt(b.share) || 0), 0)
  const sharesOk = totalShares === 10000
  const windowNumber = Number(windowDays)
  const windowSecs = Number.isFinite(windowNumber) ? BigInt(Math.round(windowNumber * 86400)) : 0n
  const minWindowDays = minWindow ? Number(minWindow) / 86400 : 7

  // ── After create confirms → redirect to dashboard ─────────────────────────
  useEffect(() => {
    if (createSuccess && step === 'creating') {
      setStep('idle')
      createReset()
      toast.success('Vault created!')
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }, [createSuccess, step, createReset, router])

  useEffect(() => {
    if (createError && step === 'creating') {
      setStep('idle')
      toast.error(createError.message || 'Vault creation failed')
      createReset()
    }
  }, [createError, step, createReset])

  const addBeneficiary = useCallback(() => {
    if (beneficiaries.length < 10) setBeneficiaries((p) => [...p, { ...DEFAULT_BEN }])
  }, [beneficiaries.length])

  const removeBeneficiary = useCallback((i: number) => {
    setBeneficiaries((p) => p.filter((_, idx) => idx !== i))
  }, [])

  const updateBeneficiary = useCallback((i: number, field: keyof Beneficiary, value: string) => {
    setBeneficiaries((p) => p.map((b, idx) => idx === i ? { ...b, [field]: value } : b))
  }, [])

  const splitEvenly = useCallback(() => {
    const n = beneficiaries.length
    const base = Math.floor(10000 / n)
    const rem = 10000 - base * n
    setBeneficiaries((p) => p.map((b, i) => ({ ...b, share: String(base + (i === n - 1 ? rem : 0)) })))
  }, [beneficiaries.length])

  const canSubmit =
    SWITCH_CONFIGURED &&
    isConnected &&
    !wrongChain &&
    name.trim().length > 0 &&
    new TextEncoder().encode(name.trim()).length <= 32 &&
    sharesOk &&
    Number.isFinite(windowNumber) &&
    windowNumber >= minWindowDays &&
    windowNumber <= 3650 &&
    depositHasValidPrecision &&
    beneficiaries.every((b) => isValidAddress(b.addr)) &&
    depositRaw <= (potBalance?.value ?? 0n)

  const handleSubmit = useCallback(() => {
    if (!ensureChain()) return
    if (!canSubmit) return

    if (step === 'idle') {
      setStep('creating')
      const nameBytes = encodeBytes32Name(name.trim())
      const addrs = beneficiaries.map((b) => b.addr as `0x${string}`)
      const shares = beneficiaries.map((b) => parseInt(b.share) || 0)
      create({
        address: SWITCH_ADDRESS,
        abi: SWITCH_ABI,
        functionName: 'createVault',
        args: [nameBytes, addrs, shares, windowSecs],
        value: depositRaw,
      })
    }
  }, [
    ensureChain, canSubmit, step,
    depositRaw, name, beneficiaries, windowSecs, create,
  ])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <p className="text-base" style={{ color: 'var(--muted)' }}>Connect your wallet to create a vault</p>
        <ConnectKitButton />
      </div>
    )
  }

  // Determine CTA state
  const isCreating = step === 'creating'

  let ctaLabel = 'Create Vault'
  if (isCreating) ctaLabel = 'Creating vault…'
  else if (wrongChain) ctaLabel = 'Switch to Portaldot V3 Testnet'
  else if (!SWITCH_CONFIGURED) ctaLabel = 'Contract unavailable'

  const ctaOnClick = wrongChain ? () => ensureChain() : handleSubmit

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Create Vault</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Set up a native POT inheritance vault on Portaldot V3.</p>
      </div>

      {!SWITCH_CONFIGURED && (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(200,144,42,0.09)', color: 'var(--ink)' }}>
          The SwitchVault contract is deployed on Portaldot V3. Vault actions need <code>NEXT_PUBLIC_SWITCH_ADDRESS</code> configured for this app.
        </div>
      )}

      {wrongChain && (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(192,90,74,0.08)', color: 'var(--danger)' }}>
          Wrong network. Switch to Portaldot V3 Testnet to continue.
        </div>
      )}

      {/* Vault name + window */}
      <Card className="p-5 space-y-4">
        <h2 className="sans text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Vault Details</h2>
        <div className="space-y-1">
          <label className="sans text-xs font-semibold" style={{ color: 'var(--muted)' }}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 32))}
            placeholder="e.g. Family Fund"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
          />
          <p className="sans text-xs" style={{ color: 'var(--subtle)' }}>{name.length}/32 chars</p>
        </div>

        <div className="space-y-1">
          <label className="sans text-xs font-semibold" style={{ color: 'var(--muted)' }}>Inactivity Window (days)</label>
          <input
            type="number"
            value={windowDays}
            onChange={(e) => setWindowDays(e.target.value)}
            min={minWindowDays}
            max={3650}
            placeholder="30"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
          />
          <p className="sans text-xs" style={{ color: 'var(--subtle)' }}>Min {minWindowDays} days · Max 3650 days</p>
        </div>
      </Card>

      {/* Initial deposit */}
      <Card className="p-5 space-y-3" spectralTop>
        <div className="flex items-center justify-between">
          <h2 className="sans text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Initial Deposit <span style={{ opacity: 0.5 }}>(optional)</span></h2>
          {potBalance !== undefined && (
            <button
              onClick={() => setDeposit(formatPot(potBalance.value * 9n / 10n).replace(/,/g, ''))}
              className="sans text-xs font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              Use 90%: {formatPot(potBalance.value * 9n / 10n)} POT
            </button>
          )}
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
          <input
            inputMode="decimal"
            value={deposit}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, '')
              if (v === '' || /^\d*\.?\d{0,18}$/.test(v)) {
                setDeposit(v)
              }
            }}
            placeholder="0.00"
            className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:opacity-20"
            style={{ color: 'var(--ink)' }}
          />
          <p className="sans mt-1 text-xs font-medium" style={{ color: 'var(--subtle)' }}>POT · leave enough for network fees</p>
        </div>
      </Card>

      {/* Beneficiaries */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="sans text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Beneficiaries
            <span className="ml-2 normal-case" style={{ color: totalShares === 10000 ? 'var(--success)' : 'var(--danger)' }}>
              {totalShares}/10000 bp
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {beneficiaries.length > 1 && (
              <Btn size="sm" variant="ghost" onClick={splitEvenly}>Split evenly</Btn>
            )}
            {beneficiaries.length < 10 && (
              <Btn size="sm" variant="secondary" onClick={addBeneficiary}>
                <Plus className="size-3" /> Add
              </Btn>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {beneficiaries.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={b.addr}
                onChange={(e) => updateBeneficiary(i, 'addr', e.target.value)}
                placeholder="0x address"
                className="mono min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
              />
              <input
                type="number"
                value={b.share}
                onChange={(e) => updateBeneficiary(i, 'share', e.target.value)}
                placeholder="bp"
                className="sans w-20 rounded-xl border px-3 py-2 text-xs outline-none tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
                min={1}
                max={10000}
              />
              <span className="sans w-10 text-center text-xs" style={{ color: 'var(--muted)' }}>
                {b.share ? `${(parseInt(b.share) / 100).toFixed(1)}%` : '—'}
              </span>
              {beneficiaries.length > 1 && (
                <button onClick={() => removeBeneficiary(i)} style={{ color: 'var(--danger)' }}>
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {!sharesOk && beneficiaries.length > 0 && (
          <p className="sans text-xs" style={{ color: 'var(--danger)' }}>Shares must sum to 10000 basis points (= 100%)</p>
        )}
      </Card>

      {/* Summary */}
      {canSubmit && (
        <Card inner className="px-4 py-3 space-y-1">
          {beneficiaries.map((b, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="mono" style={{ color: 'var(--muted)' }}>{formatAddress(b.addr)}</span>
              <span className="sans tabular-nums font-semibold" style={{ color: 'var(--ink)' }}>{(parseInt(b.share) / 100).toFixed(1)}%</span>
            </div>
          ))}
        </Card>
      )}

      {/* CTA */}
      <TxButton
        label={ctaLabel}
        onClick={ctaOnClick}
        isPending={createPending || isSwitching}
        isConfirming={createConfirming}
        isSuccess={createSuccess}
        hash={createHash}
        disabled={(!canSubmit && !wrongChain) || isCreating}
        variant={wrongChain ? 'danger' : 'primary'}
      />
    </div>
  )
}
