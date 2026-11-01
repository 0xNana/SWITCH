'use client'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ConnectKitButton } from 'connectkit'
import { Plus } from 'lucide-react'
import { VaultRow } from '@/components/VaultRow'
import { Btn } from '@/components/Btn'
import { useOwnerVaults } from '@/hooks/useVault'

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { data: vaultIds, isLoading, isError, refetch } = useOwnerVaults(address)

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-8 py-24 text-center">
        <div
          style={{
            width: 56, height: 56,
            borderRadius: 16,
            background: 'rgba(200,144,42,0.10)',
            border: '1px solid rgba(200,144,42,0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="22" height="26" viewBox="0 0 12 14" fill="none">
            <path d="M6 0.5L11.5 3.5V7C11.5 10.0376 9.07614 12.7194 6 13.5C2.92386 12.7194 0.5 10.0376 0.5 7V3.5L6 0.5Z" fill="var(--accent)" />
          </svg>
        </div>
        <div className="space-y-1.5">
          <h1
            style={{ fontFamily: 'Georgia, serif', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}
          >
            Connect your wallet
          </h1>
          <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.875rem', color: 'var(--muted)' }}>
            Connect to view and manage your vaults
          </p>
        </div>
        <ConnectKitButton />
        <Link
          href="/explore"
          style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.82rem', color: 'var(--muted)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
          className="hover:text-[var(--ink-2)] transition-colors"
        >
          Browse public vaults
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1
            style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1.1 }}
          >
            My Vaults
          </h1>
          <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.8rem', color: 'var(--subtle)', marginTop: '0.35rem' }}>
            {isLoading ? '—' : `${vaultIds?.length ?? 0} vault${vaultIds?.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/create">
          <Btn size="sm">
            <Plus className="size-3.5" /> New Vault
          </Btn>
        </Link>
      </div>

      {/* Vault list */}
      {isError ? (
        <div role="alert" className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Couldn’t load your vaults</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Check the Portaldot connection, then try again.</p>
          <Btn className="mt-4" size="sm" variant="secondary" onClick={() => { void refetch() }}>Retry</Btn>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}
        </div>
      ) : !vaultIds || vaultIds.length === 0 ? (
        <div
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            background: 'rgba(255,248,238,0.02)',
            border: '1px solid rgba(255,248,238,0.08)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div
            style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(255,248,238,0.05)',
              border: '1px solid rgba(255,248,238,0.09)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              opacity: 0.6,
            }}
          >
            <svg width="18" height="21" viewBox="0 0 12 14" fill="none">
              <path d="M6 0.5L11.5 3.5V7C11.5 10.0376 9.07614 12.7194 6 13.5C2.92386 12.7194 0.5 10.0376 0.5 7V3.5L6 0.5Z" fill="var(--muted)" />
            </svg>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: '0.5rem' }}>
            No vaults yet
          </p>
          <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '28ch', margin: '0 auto 1.5rem' }}>
            Create your first vault to start planning your digital inheritance.
          </p>
          <Link href="/create">
            <Btn size="sm"><Plus className="size-3.5" /> Create Vault</Btn>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(vaultIds as readonly bigint[]).map((id) => (
            <VaultRow key={id.toString()} id={id} showActions />
          ))}
        </div>
      )}
    </div>
  )
}
