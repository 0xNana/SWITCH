'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'
import { clsx } from 'clsx'
import { useState } from 'react'

const LINKS = [
  { href: '/dashboard',    label: 'My Vaults' },
  { href: '/create',       label: 'Create' },
  { href: '/inheritances', label: 'Inheritances' },
  { href: '/explore',      label: 'Explore' },
]

export function Nav() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(14,12,10,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,248,238,0.07)',
      }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 select-none group">
          <div
            className="flex size-7 items-center justify-center rounded-[8px] transition-opacity group-hover:opacity-80"
            style={{ background: 'var(--accent)' }}
            aria-hidden
          >
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 0.5L11.5 3.5V7C11.5 10.0376 9.07614 12.7194 6 13.5C2.92386 12.7194 0.5 10.0376 0.5 7V3.5L6 0.5Z" fill="rgba(255,248,238,0.95)" />
            </svg>
          </div>
          <span
            className="text-[15px] font-semibold tracking-tight transition-opacity group-hover:opacity-80"
            style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
          >
            SWITCH
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0 sm:flex">
          {LINKS.map(({ href, label }) => {
            const active = path === href || (href !== '/' && path.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'sans px-3.5 py-1.5 text-[13px] font-medium tracking-wide transition-colors rounded-lg',
                  active
                    ? ''
                    : 'hover:text-[var(--ink)]',
                )}
                style={{
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right: wallet + hamburger */}
        <div className="flex items-center gap-2">
          <ConnectKitButton />
          <button
            className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06] sm:hidden"
            style={{ color: 'var(--muted)' }}
            onClick={() => setOpen(v => !v)}
            aria-label="Menu"
          >
            {open
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              : <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M0 1H16M0 6H16M0 11H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="border-t px-4 pb-5 pt-2 sm:hidden animate-fade-in"
          style={{ borderColor: 'rgba(255,248,238,0.07)' }}
        >
          {LINKS.map(({ href, label }) => {
            const active = path === href || (href !== '/' && path.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  color: active ? 'var(--accent)' : 'var(--ink-2)',
                  fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
