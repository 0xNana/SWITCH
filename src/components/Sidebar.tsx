'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { clsx } from 'clsx'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Plus,
  Heart,
  Compass,
  Menu,
  X,
} from 'lucide-react'

// ── Shield SVG wordmark icon ───────────────────────────────────────────────
function SwitchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect width="28" height="28" rx="8" fill="rgba(200,144,42,0.15)" />
      <path
        d="M14 5L6 8.5V14c0 4.6 3.4 8.9 8 9.9 4.6-1 8-5.3 8-9.9V8.5L14 5Z"
        fill="none"
        stroke="#c8902a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 14l2.5 2.5 4.5-4.5"
        stroke="#c8902a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Navigation links ───────────────────────────────────────────────────────
const LINKS = [
  { href: '/dashboard',    label: 'My Vaults',    icon: LayoutDashboard },
  { href: '/create',       label: 'Create Vault', icon: Plus },
  { href: '/inheritances', label: 'Inheritances', icon: Heart },
  { href: '/explore',      label: 'Explore',      icon: Compass },
]

// ── Wallet blurb (bottom of sidebar) ─────────────────────────────────────
function WalletBlurb({ address }: { address?: string }) {
  if (!address) return null
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`
  return (
    <div
      className="mt-auto rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(255,248,238,0.04)', border: '1px solid rgba(255,248,238,0.08)' }}
    >
      <p
        className="sans mb-0.5 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--muted)' }}
      >
        Connected
      </p>
      <p className="mono text-xs truncate" style={{ color: 'var(--ink-2)' }}>{short}</p>
    </div>
  )
}

// ── Single nav item ────────────────────────────────────────────────────────
function NavItem({
  href, label, icon: Icon, active, onClick,
}: {
  href: string
  label: string
  icon: typeof LayoutDashboard
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150',
        active ? 'text-white' : 'hover:bg-[rgba(255,248,238,0.05)]',
      )}
      style={
        active
          ? {
              background: 'rgba(200,144,42,0.18)',
              color: 'var(--accent)',
              boxShadow: '0 0 0 1px rgba(200,144,42,0.24) inset',
            }
          : { color: 'var(--muted)' }
      }
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
      <Icon
        className="size-4 shrink-0"
        strokeWidth={active ? 2.2 : 1.8}
        style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
      />
      <span
        className="sans text-sm font-medium"
        style={{ color: active ? 'var(--accent)' : 'var(--ink-2)' }}
      >
        {label}
      </span>
    </Link>
  )
}

// ── Desktop sidebar (fixed left, 220px) ───────────────────────────────────
export function Sidebar() {
  const path = usePathname()
  const { address } = useAccount()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <div className="flex h-full flex-col gap-1 p-4">
      {/* Wordmark */}
      <div className="mb-6 flex items-center gap-2.5 px-1">
        <SwitchIcon />
        <span
          className="display text-base font-bold"
          style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
        >
          SWITCH
        </span>
      </div>

      {/* Section: Vaults */}
      <p className="section-label px-3">Vaults</p>
      {LINKS.slice(0, 2).map(({ href, label, icon }) => (
        <NavItem
          key={href}
          href={href}
          label={label}
          icon={icon}
          active={path === href || (href !== '/' && path.startsWith(href))}
          onClick={() => setMobileOpen(false)}
        />
      ))}

      {/* Section: Discover */}
      <p className="section-label mt-5 px-3">Discover</p>
      {LINKS.slice(2).map(({ href, label, icon }) => (
        <NavItem
          key={href}
          href={href}
          label={label}
          icon={icon}
          active={path === href || (href !== '/' && path.startsWith(href))}
          onClick={() => setMobileOpen(false)}
        />
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* ConnectKit wallet button */}
      <div className="mt-1">
        <ConnectKitButton />
      </div>

      {/* Wallet blurb */}
      <WalletBlurb address={address} />
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden flex-col lg:flex"
        style={{
          width: 220,
          background: 'rgba(255,248,238,0.025)',
          borderRight: '1px solid rgba(255,248,238,0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header
        className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden"
        style={{
          background: 'rgba(14,12,10,0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,248,238,0.08)',
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <SwitchIcon />
          <span className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>SWITCH</span>
        </Link>
        <div className="flex items-center gap-2">
          <ConnectKitButton />
          <button
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-[rgba(255,248,238,0.06)]"
            style={{ color: 'var(--ink-2)' }}
            aria-label="Open menu"
          >
            <Menu className="size-5" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.aside
              className="absolute inset-y-0 left-0 flex flex-col"
              style={{
                width: 260,
                background: '#130f0b',
                borderRight: '1px solid rgba(255,248,238,0.10)',
              }}
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-xl transition-colors hover:bg-[rgba(255,248,238,0.06)]"
                style={{ color: 'var(--muted)' }}
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>

              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
