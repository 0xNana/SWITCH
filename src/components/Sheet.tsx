'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  spectral?: boolean
}

const SHEET_SPRING = { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 } as const
const OVERLAY_TRANSITION = { duration: 0.22, ease: 'easeOut' } as const

export function Sheet({ open, onClose, title, children, spectral }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={OVERLAY_TRANSITION}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(4px)' }} />

          {/* Sheet */}
          <motion.section
            className="relative w-full max-w-lg overflow-hidden"
            style={{
              background: '#1a1612',
              borderTop: '1px solid rgba(255,248,238,0.12)',
              borderLeft: '1px solid rgba(255,248,238,0.07)',
              borderRight: '1px solid rgba(255,248,238,0.07)',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -8px 60px rgba(0,0,0,0.7)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SHEET_SPRING}
            onClick={(e) => e.stopPropagation()}
          >
            {spectral && (
              <div className="h-[2px]" style={{ background: 'var(--spectral)', opacity: 0.6 }} />
            )}

            {/* Drag pill */}
            <div className="flex justify-center pt-3 pb-0">
              <div className="h-[3px] w-10 rounded-full" style={{ background: 'rgba(255,248,238,0.15)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 pt-3">
              <h2
                className="text-base font-semibold"
                style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-white/[0.07]"
                style={{ color: 'var(--subtle)' }}
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="h-px mx-6" style={{ background: 'rgba(255,248,238,0.07)' }} />

            {/* Body */}
            <div className="max-h-[76dvh] overflow-y-auto px-6 pb-10 pt-5">
              {children}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
