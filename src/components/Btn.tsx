'use client'

import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { ReactNode, CSSProperties } from 'react'

interface BtnProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
  style?: CSSProperties
}

const VARIANTS: Record<NonNullable<BtnProps['variant']>, CSSProperties> = {
  primary:   { background: 'var(--accent)', color: '#0e0c0a', fontWeight: 600 },
  secondary: { background: 'rgba(255,248,238,0.07)', color: 'var(--ink)', border: '1px solid rgba(255,248,238,0.12)' },
  danger:    { background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(192,90,74,0.20)' },
  ghost:     { background: 'transparent', color: 'var(--muted)' },
  success:   { background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(90,156,106,0.20)' },
}

const HOVER: Record<NonNullable<BtnProps['variant']>, string> = {
  primary:   'hover:brightness-110',
  secondary: 'hover:bg-white/[0.10]',
  danger:    'hover:brightness-110',
  ghost:     'hover:bg-white/[0.05]',
  success:   'hover:brightness-110',
}

export function Btn({
  children, onClick, disabled, loading, variant = 'primary',
  size = 'md', className, type = 'button', fullWidth, style,
}: BtnProps) {
  const sizes = {
    xs: 'h-6 px-2.5 text-xs rounded-xl gap-1',
    sm: 'h-8 px-3.5 text-xs rounded-[12px] gap-1.5',
    md: 'h-9 px-4   text-sm rounded-[14px] gap-2',
    lg: 'h-11 px-6  text-sm rounded-2xl gap-2',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center tracking-wide',
        'transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]',
        'disabled:cursor-not-allowed disabled:opacity-35',
        'active:scale-[0.97]',
        HOVER[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      style={{
        fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
        fontWeight: 500,
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  )
}
