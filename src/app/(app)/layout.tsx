import { Sidebar } from '@/components/Sidebar'
import { SWITCH_CONFIGURED } from '@/lib/contract'

const SIDEBAR_W = 220 // px — must match Sidebar.tsx

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      {/* Warm ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0, right: 0,
          width: 520, height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,144,42,0.05) 0%, transparent 70%)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Sidebar />

      {/*
        Mobile: full width, top-padded to clear the fixed header (~57px)
        Desktop (lg): shift right by sidebar width so content never hides behind sidebar
      */}
      <main
        className="relative z-10 animate-slide-up"
        style={{
          paddingTop: 'var(--content-pt, 80px)',
          paddingBottom: '7rem',
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            main { padding-left: ${SIDEBAR_W + 32}px; padding-top: 2.5rem; }
          }
          @media (max-width: 1023px) {
            main { padding-left: 1rem; padding-right: 1rem; }
          }
        `}</style>
        <div style={{ maxWidth: '48rem' }}>
          {!SWITCH_CONFIGURED && (
            <div
              role="status"
              className="mb-6 rounded-2xl px-4 py-3 text-sm"
              style={{ background: 'rgba(200,144,42,0.09)', border: '1px solid rgba(200,144,42,0.2)', color: 'var(--ink-2)' }}
            >
              <strong style={{ color: 'var(--ink)' }}>Contract configuration missing.</strong>{' '}
              Vault data and transactions will appear after <code>NEXT_PUBLIC_SWITCH_ADDRESS</code> is configured.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
