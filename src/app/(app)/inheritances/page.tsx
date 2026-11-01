'use client'

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import Link from 'next/link'
import { ExternalLink, Heart, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { Countdown } from '@/components/Countdown'
import { Btn } from '@/components/Btn'
import { TxButton } from '@/components/TxButton'
import { EmailRegistration } from '@/components/EmailRegistration'
import { useBeneficiaryVaults, useVaults, useVaultDeadline } from '@/hooks/useVault'
import { useChainGuard } from '@/hooks/useChainGuard'
import {
  SWITCH_ADDRESS, SWITCH_ABI, VaultStatus,
  formatPot, decodeBytes32Name, formatAddress, explorerAddr, payoutForBeneficiary,
} from '@/lib/contract'

export default function InheritancesPage() {
  const { address, isConnected } = useAccount()
  const { data: vaultIds, isLoading } = useBeneficiaryVaults(address)
  const { data: vaults } = useVaults([...(vaultIds ?? [])])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <p className="text-base" style={{ color: 'var(--muted)' }}>Connect your wallet to see inheritances</p>
        <ConnectKitButton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>My Inheritances</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
          Vaults where you are a named beneficiary
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl" style={{ background: 'rgba(18,45,69,0.06)' }} />)}
        </div>
      ) : !vaultIds || vaultIds.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="mx-auto mb-4 size-10 opacity-20" style={{ color: 'var(--ink)' }} />
          <p className="display text-base font-semibold" style={{ color: 'var(--ink)' }}>No inheritances yet</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>You haven't been added as a beneficiary to any vault</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {vaultIds.map((id, i) => {
            const result = vaults?.[i]
            if (result?.status !== 'success' || !result.result) return null
            const [owner, name, , , balance, releasedBalance, status, beneficiaryAddrs, beneficiaryShares] = result.result
            const myIndex = (beneficiaryAddrs as string[]).findIndex((a) => a.toLowerCase() === address?.toLowerCase())
            const myShare = myIndex >= 0 ? (beneficiaryShares as number[])[myIndex] : 0
            const myPayout = Number(status) === VaultStatus.Released
              ? payoutForBeneficiary(releasedBalance as bigint, beneficiaryShares as number[], myIndex)
              : 0n
            return (
              <InheritanceCard
                key={id.toString()}
                id={id}
                name={decodeBytes32Name(name as string)}
                owner={owner as string}
                balance={balance as bigint}
                releasedBalance={releasedBalance as bigint}
                status={Number(status)}
                myShare={myShare}
                myPayout={myPayout}
                myIndex={myIndex}
                userAddress={address!}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function InheritanceCard({
  id, name, owner, balance, releasedBalance, status, myShare, myPayout, myIndex, userAddress,
}: {
  id: bigint; name: string; owner: string; balance: bigint; releasedBalance: bigint;
  status: number; myShare: number; myPayout: bigint; myIndex: number; userAddress: string;
}) {
  const { ensureChain } = useChainGuard()
  const { data: deadlineTs } = useVaultDeadline(id)
  const { writeContract, data: hash, isPending, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) {
    toast.success('Transaction confirmed!')
    reset()
  }

  const isActive = status === VaultStatus.Active
  const isReleased = status === VaultStatus.Released
  const canRelease = isActive && deadlineTs && Number(deadlineTs) < Math.floor(Date.now() / 1000) && balance > 0n

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/vault/${id}`} className="display text-base font-bold hover:underline" style={{ color: 'var(--ink)' }}>{name}</Link>
            <StatusBadge status={status} />
          </div>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
            Vault #{id.toString()} · By{' '}
            <a href={explorerAddr(owner)} target="_blank" rel="noreferrer" className="mono inline-flex items-center gap-0.5 hover:underline">
              {formatAddress(owner)} <ExternalLink className="size-2.5" />
            </a>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="display text-xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{formatPot(balance)}</p>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>POT total</p>
        </div>
      </div>

      {/* My share */}
      <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(26,128,71,0.06)', border: '1px solid rgba(26,128,71,0.12)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Your share: {(myShare / 100).toFixed(1)}%</span>
          {isReleased && myPayout > 0n && (
            <span className="display text-sm font-bold tabular-nums" style={{ color: 'var(--success)' }}>
              {formatPot(myPayout)} POT
            </span>
          )}
        </div>
      </div>

      {/* Email notification */}
      <EmailRegistration
        vaultId={id.toString()}
        address={userAddress}
        role="beneficiary"
        label="Get notified when released"
      />

      {/* Countdown */}
      {isActive && deadlineTs && (
        <Countdown deadline={Number(deadlineTs)} />
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {canRelease && (
          <TxButton
            label="Trigger Release"
            onClick={() => {
              if (!ensureChain()) return
              writeContract({ address: SWITCH_ADDRESS, abi: SWITCH_ABI, functionName: 'release', args: [id] })
            }}
            isPending={isPending}
            isConfirming={isConfirming}
            isSuccess={isSuccess}
            hash={hash}
          />
        )}
        {isReleased && myPayout > 0n && (
          <TxButton
            label="Claim My Share"
            onClick={() => {
              if (!ensureChain()) return
              writeContract({ address: SWITCH_ADDRESS, abi: SWITCH_ABI, functionName: 'claim', args: [id, BigInt(myIndex)] })
            }}
            isPending={isPending}
            isConfirming={isConfirming}
            isSuccess={isSuccess}
            hash={hash}
            variant="success"
          />
        )}
        {isReleased && balance > 0n && (
          <Btn variant="secondary" onClick={() => {
            if (!ensureChain()) return
            writeContract({ address: SWITCH_ADDRESS, abi: SWITCH_ABI, functionName: 'claimAll', args: [id] })
          }} disabled={isPending || isConfirming}>
            <Heart className="size-3" /> Pay Everyone
          </Btn>
        )}
      </div>
    </Card>
  )
}
