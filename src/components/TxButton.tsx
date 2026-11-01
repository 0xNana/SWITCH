'use client'

import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { explorerTx } from '@/lib/contract'

interface TxButtonProps {
  label: string
  onClick: () => void
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  hash?: `0x${string}` | string
  disabled?: boolean
  variant?: 'primary' | 'success' | 'danger'
  fullWidth?: boolean
}

const BG: Record<NonNullable<TxButtonProps['variant']>, string> = {
  primary: 'var(--accent)',
  success: 'var(--success)',
  danger:  'var(--danger)',
}

const COLOR: Record<NonNullable<TxButtonProps['variant']>, string> = {
  primary: '#0e0c0a',
  success: '#0e0c0a',
  danger:  '#f5efe4',
}

export function TxButton({
  label, onClick, isPending, isConfirming, isSuccess,
  hash, disabled, variant = 'primary', fullWidth = true,
}: TxButtonProps) {
  const isLoading = isPending || isConfirming
  const bg = isSuccess ? 'var(--success)' : BG[variant]
  const fg = isSuccess ? '#f5efe4' : COLOR[variant]

  const inner = isLoading ? (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="size-3.5 animate-spin" />
      {isPending ? 'Confirm in wallet…' : 'Confirming on Portaldot…'}
    </span>
  ) : isSuccess ? (
    <span className="flex items-center justify-center gap-2">
      <CheckCircle2 className="size-3.5" />
      Done
    </span>
  ) : (
    label
  )

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className="relative overflow-hidden py-3 text-sm transition-all duration-150 select-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]
          disabled:cursor-not-allowed disabled:opacity-35
          active:scale-[0.98] hover:brightness-110"
        style={{
          background: bg,
          color: fg,
          fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.01em',
          borderRadius: '12px',
          width: fullWidth ? '100%' : undefined,
          display: fullWidth ? 'block' : 'inline-block',
        }}
      >
        {inner}
      </button>

      {isSuccess && hash && (
        <a
          href={explorerTx(hash as string)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs transition-opacity hover:opacity-70"
          style={{
            color: 'var(--accent)',
            fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          View on Portaldot Scanner <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  )
}
