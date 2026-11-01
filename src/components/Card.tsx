'use client'

import { clsx } from 'clsx'
import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  inner?: boolean
  spectralTop?: boolean
  hover?: boolean
  style?: CSSProperties
}

export function Card({ children, className, inner, spectralTop, hover, style }: CardProps) {
  const base = inner
    ? 'glass-inner rounded-2xl'
    : clsx(
        'glass-card overflow-hidden transition-shadow duration-200',
        hover && 'hover:shadow-[0_12px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,248,238,0.14)_inset] cursor-pointer',
      )

  return (
    <div
      className={clsx(base, className)}
      style={{ borderRadius: 'var(--radius-card)', ...style }}
    >
      {spectralTop && (
        <div className="h-[2px] w-full" style={{ background: 'var(--spectral)', opacity: 0.7 }} />
      )}
      {children}
    </div>
  )
}
