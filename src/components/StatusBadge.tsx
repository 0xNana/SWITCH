'use client'

type Status = 'Active' | 'Released' | 'Closed' | 'None'

const NUM_TO_STATUS: Record<number, Status> = { 0: 'None', 1: 'Active', 2: 'Released', 3: 'Closed' }

const CONFIG: Record<Status, { dot: string; text: string; bg: string; border: string; pulse: boolean }> = {
  Active:   { dot: '#5a9c6a', text: '#5a9c6a', bg: 'rgba(90,156,106,0.08)', border: 'rgba(90,156,106,0.20)', pulse: true },
  Released: { dot: '#c8902a', text: '#c8902a', bg: 'rgba(200,144,42,0.08)', border: 'rgba(200,144,42,0.22)', pulse: false },
  Closed:   { dot: '#5a4f42', text: '#8a7762', bg: 'rgba(90,79,66,0.08)',   border: 'rgba(90,79,66,0.18)',   pulse: false },
  None:     { dot: '#5a4f42', text: '#8a7762', bg: 'rgba(90,79,66,0.06)',   border: 'rgba(90,79,66,0.14)',   pulse: false },
}

export function StatusBadge({ status }: { status: Status | number }) {
  const resolved: Status = typeof status === 'number' ? (NUM_TO_STATUS[status] ?? 'None') : status
  const c = CONFIG[resolved] ?? CONFIG.None
  const label = resolved

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        fontSize: '0.7rem',
        fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
        fontWeight: 500,
        letterSpacing: '0.04em',
        color: c.text,
      }}
    >
      <span className="relative flex size-1.5 shrink-0">
        {c.pulse && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: c.dot, animation: 'pulse-ring 1.8s cubic-bezier(0,0,0.2,1) infinite' }}
          />
        )}
        <span
          className="relative inline-flex size-1.5 rounded-full"
          style={{ background: c.dot }}
        />
      </span>
      {label}
    </span>
  )
}
