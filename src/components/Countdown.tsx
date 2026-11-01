'use client'

import { useEffect, useState } from 'react'

function split(secs: number) {
  const s = Math.max(0, secs)
  return {
    days:  Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins:  Math.floor((s % 3600) / 60),
    secs:  s % 60,
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

type Urgency = 'ok' | 'warning' | 'danger' | 'expired'

function urgency(remaining: number): Urgency {
  if (remaining <= 0)        return 'expired'
  if (remaining < 3600 * 4)  return 'danger'
  if (remaining < 86400 * 3) return 'warning'
  return 'ok'
}

const COLORS: Record<Urgency, { num: string; label: string; bar: string; track: string }> = {
  ok:      { num: 'var(--ink)',    label: 'var(--muted)', bar: 'rgba(255,248,238,0.18)', track: 'rgba(255,248,238,0.06)' },
  warning: { num: 'var(--accent)', label: 'var(--muted)', bar: 'var(--accent)',           track: 'rgba(200,144,42,0.10)' },
  danger:  { num: 'var(--danger)', label: 'var(--muted)', bar: 'var(--danger)',            track: 'rgba(192,90,74,0.12)' },
  expired: { num: 'var(--danger)', label: 'var(--muted)', bar: 'var(--danger)',            track: 'rgba(192,90,74,0.12)' },
}

interface CountdownProps {
  deadline: number
  windowSecs?: number
}

export function Countdown({ deadline, windowSecs }: CountdownProps) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = deadline - now
  const u = urgency(remaining)
  const c = COLORS[u]
  const pct = windowSecs
    ? Math.max(0, Math.min(100, (remaining / windowSecs) * 100))
    : Math.max(0, Math.min(100, (remaining / (365 * 86400)) * 100))

  if (u === 'expired') {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold" style={{ color: 'var(--danger)', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}>
          Window expired — eligible for release
        </p>
        <div className="h-px w-full" style={{ background: 'var(--danger)', opacity: 0.4 }} />
      </div>
    )
  }

  const { days, hours, mins, secs } = split(remaining)

  return (
    <div className="space-y-3">
      {/* Time units */}
      <div className="flex items-baseline gap-4">
        {days > 0 && (
          <div>
            <span
              className="text-3xl font-bold tabular-nums leading-none"
              style={{ color: c.num, fontFamily: 'Georgia, serif', letterSpacing: '-0.04em' }}
            >
              {days}
            </span>
            <span className="ml-1 text-xs" style={{ color: c.label, fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}>
              {days === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}
        <div>
          <span
            className="text-3xl font-bold tabular-nums leading-none"
            style={{ color: c.num, fontFamily: 'Georgia, serif', letterSpacing: '-0.04em' }}
          >
            {pad(hours)}
          </span>
          <span className="ml-1 text-xs" style={{ color: c.label, fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}>h</span>
        </div>
        <div>
          <span
            className="text-3xl font-bold tabular-nums leading-none"
            style={{ color: c.num, fontFamily: 'Georgia, serif', letterSpacing: '-0.04em' }}
          >
            {pad(mins)}
          </span>
          <span className="ml-1 text-xs" style={{ color: c.label, fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}>m</span>
        </div>
        {days === 0 && (
          <div>
            <span
              className="text-3xl font-bold tabular-nums leading-none"
              style={{ color: c.num, fontFamily: 'Georgia, serif', letterSpacing: '-0.04em' }}
            >
              {pad(secs)}
            </span>
            <span className="ml-1 text-xs" style={{ color: c.label, fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}>s</span>
          </div>
        )}
        <p
          className="ml-auto text-xs"
          style={{ color: 'var(--subtle)', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}
        >
          until release eligible
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-px w-full overflow-hidden rounded-full" style={{ background: c.track }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: c.bar }}
        />
      </div>
    </div>
  )
}
