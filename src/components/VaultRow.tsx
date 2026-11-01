'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { StatusBadge } from '@/components/StatusBadge'
import { Countdown } from '@/components/Countdown'
import { useVault, useVaultDeadline } from '@/hooks/useVault'
import { formatPot, decodeBytes32Name, VaultStatus, GRACE_PERIOD_SECONDS } from '@/lib/contract'

interface VaultRowProps {
  id: bigint
  showActions?: boolean
}

export function VaultRow({ id, showActions }: VaultRowProps) {
  const { data, isLoading } = useVault(id)
  const { data: deadlineTs } = useVaultDeadline(id)

  if (isLoading) {
    return <div className="skeleton h-24" />
  }
  if (!data) return null

  const [, name, windowSecs, , balance, , status] = data
  const displayName = decodeBytes32Name(name as string)
  const statusNum = Number(status)
  const isActive = statusNum === VaultStatus.Active
  const remaining = deadlineTs ? Number(deadlineTs) - Math.floor(Date.now() / 1000) : Infinity
  const isExpiredSoon = isActive && remaining < 7 * 86400 && remaining > 0
  const isExpired = isActive && remaining <= 0

  return (
    <Link href={`/vault/${id}`} className="block group">
      <motion.div
        whileHover={{ y: -1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <div
          className="overflow-hidden transition-all duration-200"
          style={{
            background: 'rgba(255,248,238,0.04)',
            border: '1px solid rgba(255,248,238,0.09)',
            borderRadius: 'var(--radius-card)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Top line: urgency strip */}
          {(isExpiredSoon || isExpired) && (
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'var(--accent)', opacity: 0.7 }}
            />
          )}

          <div className="flex items-start justify-between gap-4">
            {/* Left */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="truncate font-semibold"
                  style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif', fontSize: '1rem', letterSpacing: '-0.01em' }}
                >
                  {displayName}
                </span>
                <StatusBadge status={statusNum} />
                {(isExpiredSoon || isExpired) && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                    style={{
                      background: 'rgba(200,144,42,0.10)',
                      color: 'var(--accent)',
                      fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
                      fontWeight: 500,
                    }}
                  >
                    <AlertTriangle className="size-3" />
                    {isExpired ? 'Expired' : 'Expiring soon'}
                  </span>
                )}
              </div>

              <p
                className="text-xs"
                style={{ color: 'var(--subtle)', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}
              >
                Vault #{id.toString()}
              </p>

              {isActive && deadlineTs && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,248,238,0.06)' }}>
                  <Countdown
                    deadline={Number(deadlineTs)}
                    windowSecs={Number(windowSecs as bigint) + GRACE_PERIOD_SECONDS}
                  />
                </div>
              )}
            </div>

            {/* Right: balance + arrow */}
            <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
              <p
                className="font-bold tabular-nums"
                style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif', fontSize: '1.25rem', letterSpacing: '-0.03em' }}
              >
                {formatPot(balance as bigint)}
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--subtle)', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}
              >
                POT
              </p>
              {showActions && (
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                  className="mt-1 transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{ color: 'var(--subtle)' }}
                >
                  <path d="M3 7H11M8 4L11 7L8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
