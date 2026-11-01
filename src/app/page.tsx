import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// ─── Section primitives ────────────────────────────────────────────────────
function Rule() {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        margin: '0 auto',
        maxWidth: '48rem',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,248,238,0.12) 30%, rgba(255,248,238,0.12) 70%, transparent 100%)',
      }}
    />
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
      fontSize: '0.68rem',
      fontWeight: 600,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--muted)',
      marginBottom: '1.25rem',
    }}>
      {children}
    </p>
  )
}

// ─── Landing ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="relative min-h-dvh grain" style={{ background: 'var(--bg-gradient)', color: 'var(--ink)' }}>

      {/* Warm top-right glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: '-10%', right: '-5%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,144,42,0.08) 0%, transparent 65%)',
          filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* ── Top nav ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(14,12,10,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,248,238,0.07)',
        }}
      >
        <div className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-7 items-center justify-center rounded-[8px]"
              style={{ background: 'var(--accent)' }}
            >
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                <path d="M6 0.5L11.5 3.5V7C11.5 10.0376 9.07614 12.7194 6 13.5C2.92386 12.7194 0.5 10.0376 0.5 7V3.5L6 0.5Z" fill="rgba(255,248,238,0.95)" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              SWITCH
            </span>
          </div>
          <Link
            href="/dashboard"
            className="transition-opacity hover:opacity-80"
            style={{
              fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
              fontSize: '0.82rem',
              fontWeight: 500,
              color: 'var(--accent)',
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            Launch app <ArrowRight style={{ width: 13, height: 13, display: 'inline' }} />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 pb-28 pt-28 text-center" style={{ maxWidth: '100%' }}>
        <div className="mx-auto" style={{ maxWidth: '44rem' }}>

          <h1
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(2.6rem, 7vw, 4.5rem)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: 'var(--ink)',
              marginBottom: '1.75rem',
              textWrap: 'balance',
            }}
          >
            Your POT,<br />
            in the right hands.<br />
            <span style={{ color: 'var(--accent)' }}>Even when you can&rsquo;t be there.</span>
          </h1>

          <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--ink-2)', maxWidth: '38ch', margin: '0 auto 2.5rem', textWrap: 'pretty' }}>
            A vault for your POT. Choose who should receive it,
            then check in every so often. If you ever stop, it passes
            to them in the shares you set — no middleman, no key.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', justifyContent: 'center', alignItems: 'center' }}>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--accent)',
                color: '#0e0c0a',
                fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 600,
                fontSize: '0.88rem',
                letterSpacing: '0.01em',
                padding: '0.75rem 1.75rem',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'filter 0.15s',
              }}
              className="hover:brightness-110"
            >
              Launch app <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
            <a
              href="#how-it-works"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 500,
                fontSize: '0.88rem',
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              className="hover:text-[var(--ink-2)]"
            >
              See how it works ↓
            </a>
          </div>

          <p style={{ marginTop: '1.75rem', fontSize: '0.72rem', color: 'var(--subtle)', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}>
            Portaldot V3 testnet software — unaudited. Use test tokens only.
          </p>
        </div>
      </section>

      <Rule />

      {/* ── The Problem ── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: '40rem' }}>
          <Label>The problem</Label>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--ink)', marginBottom: '1.25rem', textWrap: 'balance' }}>
            Your money is safe with you.<br />That&rsquo;s the problem.
          </h2>
          <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.95rem', lineHeight: 1.75, color: 'var(--ink-2)', marginBottom: '2.5rem', maxWidth: '56ch', textWrap: 'pretty' }}>
            Your POT stays in a vault governed by rules you can inspect on-chain.
            But it also means nobody else can reach it. If you&rsquo;re gone, or simply
            can&rsquo;t get to your wallet, those funds can sit untouched indefinitely —
            even when the people you&rsquo;d want to have them are right there.
          </p>

          <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              { label: 'Share your phrase', detail: 'Gives someone full access today — not just someday.' },
              { label: 'Use a custodian', detail: 'Trust a company to still be there, and to act, when it matters.' },
              { label: 'Write it down', detail: 'Relies on the right person finding it and knowing what to do.' },
            ].map(({ label, detail }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(192,90,74,0.06)',
                  border: '1px solid rgba(192,90,74,0.14)',
                  borderRadius: 16,
                  padding: '1.25rem',
                }}
              >
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>{label}</p>
                <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.65 }}>{detail}</p>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '2rem',
              padding: '1.25rem 1.5rem',
              borderLeft: '3px solid var(--accent)',
              background: 'rgba(200,144,42,0.05)',
              borderRadius: '0 12px 12px 0',
            }}
          >
            <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.9rem', color: 'var(--ink-2)', lineHeight: 1.7, margin: 0 }}>
              SWITCH takes another approach. You keep control while your vault is active.
              If you stop checking in, the rules you set decide where the money goes.
            </p>
          </div>
        </div>
      </section>

      <Rule />

      {/* ── How it works ── */}
      <section id="how-it-works" className="relative z-10 px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: '40rem' }}>
          <Label>How it works</Label>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--ink)', marginBottom: '2.5rem', textWrap: 'balance' }}>
            Four steps.<br />Then you just live your life.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {[
              { n: '1', title: 'Create your vault', body: 'Give it a name and add the POT you want to set aside. You can add more later, or take some back.' },
              { n: '2', title: 'Choose your people', body: 'Add up to 10 beneficiaries by wallet address and decide how much each one receives. Shares must add up to exactly 100%.' },
              { n: '3', title: 'Set your check-in window', body: 'Choose how long SWITCH should wait after your last check-in — from 7 days to 10 years. Then press “I’m Alive” now and then to reset the clock.' },
              { n: '4', title: 'A safety period comes first', body: 'After the check-in window ends, a 7-day grace period begins. You can still check in during that time. Afterward, anyone can trigger release and pay beneficiaries.' },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 9999,
                    border: '1px solid rgba(255,248,238,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    marginTop: 2,
                  }}
                >
                  {n}
                </div>
                <div>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>{title}</p>
                  <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.875rem', color: 'var(--ink-2)', lineHeight: 1.75, margin: 0, maxWidth: '48ch' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '2.5rem',
              padding: '1.1rem 1.35rem',
              background: 'rgba(255,248,238,0.03)',
              border: '1px solid rgba(255,248,238,0.09)',
              borderRadius: 14,
            }}
          >
            <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: 'var(--ink-2)' }}>Good to know:</strong>{' '}
              When you withdraw funds or update your beneficiaries, that also counts as checking in. Adding funds does not. Use &ldquo;I&rsquo;m Alive&rdquo; for that.
            </p>
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Features ── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: '52rem' }}>
          <Label>Features</Label>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--ink)', marginBottom: '2.5rem', maxWidth: '28ch', textWrap: 'balance' }}>
            Built to be simple, and built so it can&rsquo;t be quietly changed.
          </h2>

          <div style={{ display: 'grid', gap: '1px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', background: 'rgba(255,248,238,0.07)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,248,238,0.07)' }}>
            {[
              { title: 'You stay in control while you\'re here', body: 'Add, withdraw, update beneficiaries, or close the vault for a full refund — until the window runs out, it\'s yours.' },
              { title: 'Shares paid exactly as you set them', body: 'Set each person\'s share in 0.01% increments. The last beneficiary also absorbs any rounding — the whole balance goes out.' },
              { title: 'Beneficiaries don\'t have to do anything', body: 'Anyone can pay everyone in a single transaction. Your beneficiaries never need to sign or keep funds on hand for gas.' },
              { title: 'One problem doesn\'t block everyone', body: 'If a beneficiary wallet rejects a transfer, other beneficiaries can still claim their shares.' },
              { title: 'No admin keys. No upgrades. No pause.', body: 'Nobody — including the people who built this — can change the rules, freeze your vault, or move your funds.' },
              { title: 'POT, start to finish', body: 'Vault deposits and payouts use POT, Portaldot V3’s native token.' },
              { title: 'Family can contribute', body: 'Anyone can add POT while your check-in window is open. Only you can withdraw from the vault.' },
              { title: 'See everything at a glance', body: 'Your dashboard shows every vault with a live countdown. Beneficiaries have their own Inheritances page.' },
            ].map(({ title, body }) => (
              <div
                key={title}
                style={{ background: 'var(--bg)', padding: '1.5rem 1.625rem' }}
                className="hover:bg-[rgba(255,248,238,0.02)] transition-colors"
              >
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem', letterSpacing: '-0.01em', lineHeight: 1.35 }}>{title}</p>
                <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Who it's for ── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: '40rem' }}>
          <Label>Who it&rsquo;s for</Label>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--ink)', marginBottom: '2.5rem', textWrap: 'balance' }}>
            For anyone who&rsquo;s ever wondered, &ldquo;What if?&rdquo;
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid rgba(255,248,238,0.09)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              { who: 'Families and partners', detail: 'Set aside POT for people they trust without sharing a recovery phrase.' },
              { who: 'People who travel, sail, or work far from home', detail: 'Set a window that fits how you live. A few weeks off the grid won\'t trigger anything — a long silence will.' },
              { who: 'Portaldot users', detail: 'Give on-chain assets a clear plan, split among the people or causes they choose.' },
              { who: 'Anyone who worries about losing access', detail: 'If you lose your wallet and can\'t check in, your vault still goes to the people you named.' },
              { who: 'The careful', detail: 'Start with a small amount to see how every step works before you commit anything that matters.' },
            ].map(({ who, detail }, i, arr) => (
              <div
                key={who}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,248,238,0.07)' : 'none',
                  background: 'rgba(255,248,238,0.02)',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
                className="hover:bg-[rgba(255,248,238,0.03)] transition-colors"
              >
                <span style={{ color: 'var(--accent)', marginTop: '0.35rem', fontSize: '0.7rem', flexShrink: 0 }}>◆</span>
                <div>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.3rem', letterSpacing: '-0.01em' }}>{who}</p>
                  <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.7, margin: 0, maxWidth: '50ch' }}>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Trust & Security ── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: '40rem' }}>
          <Label>Trust &amp; security</Label>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--ink)', marginBottom: '2.5rem', textWrap: 'balance' }}>
            What you can count on, and what you should know.
          </h2>

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div style={{ background: 'rgba(90,156,106,0.05)', border: '1px solid rgba(90,156,106,0.15)', borderRadius: 16, padding: '1.5rem' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)', marginBottom: '1rem', letterSpacing: '-0.01em' }}>What the code guarantees</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'No one else holds the keys. No owner, no admin, no pause switch, no upgrade path.',
                  'Funds go only where you said. Anyone may trigger a release, but nobody can redirect the money.',
                  'Nothing happens early. A 7-day grace period follows the check-in window.',
                  'One problem doesn\'t block everyone. Failed payouts remain claimable individually.',
                  'Everything is on the record — public on Portaldot V3.',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', gap: '0.625rem', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.8rem', color: 'var(--ink-2)', lineHeight: 1.65 }}>
                    <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.05em' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'rgba(192,90,74,0.05)', border: '1px solid rgba(192,90,74,0.14)', borderRadius: 16, padding: '1.5rem' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '1rem', letterSpacing: '-0.01em' }}>What you should know</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  "This testnet build hasn't been independently audited. Use test tokens only.",
                  'Release is irreversible once submitted. Check in during the grace period if needed.',
                  'Email reminders are a work in progress. They need the separate Bun backend and durable storage deployed before they’ll work in production.',
                  "Your vault is public. Balances and addresses are visible on-chain.",
                  "Tell your people. SWITCH doesn't contact beneficiaries automatically — they need to know.",
                  "It isn't a legal will. It only covers the POT you put in the vault.",
                ].map(item => (
                  <li key={item} style={{ display: 'flex', gap: '0.625rem', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.8rem', color: 'var(--ink-2)', lineHeight: 1.65 }}>
                    <span style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '0.05em' }}>!</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Rule />

      {/* ── FAQ ── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: '40rem' }}>
          <Label>FAQ</Label>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--ink)', marginBottom: '2.5rem' }}>
            Common questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid rgba(255,248,238,0.09)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              {
                q: 'What exactly happens if I stop checking in?',
                a: 'Nothing happens right away. Once your window has fully passed, the vault becomes eligible for release. Someone — a beneficiary, a friend, or anyone else — presses "Trigger Release." Then anyone can press "Pay Everyone" to send every beneficiary their share, or each can claim individually.',
              },
              {
                q: "What if I forget, or I'm in the hospital, and my deadline passes?",
                a: "The vault doesn't pay out the moment your deadline passes — someone has to trigger the release. Until that happens, checking in brings the vault back to normal. Once anyone triggers the release, it's final. Choose a window with plenty of margin and set yourself a reminder.",
              },
              {
                q: 'Do my beneficiaries need crypto to receive their share?',
                a: 'A beneficiary does not need to submit a claim. Anyone can trigger release and send the shares on-chain; the caller pays the transaction fee.',
              },
              {
                q: 'Can I change my mind?',
                a: 'You can check in, add or withdraw POT, update beneficiaries, or close the vault while its check-in window is open. If you miss it, you can still check in during the 7-day grace period; deposits, withdrawals, beneficiary changes, and closing pause until the vault is back within its window.',
              },
              {
                q: 'Can SWITCH, or anyone else, take my money?',
                a: 'The contract has no admin keys or upgrade mechanism. Funds can move only through the rules you set: withdraw while active, or release to the named beneficiaries after the grace period.',
              },
              {
                q: "What if one of my beneficiaries loses access to their wallet?",
                a: "Their share will remain locked in the vault, unclaimed. It won't be redistributed. Update your beneficiary list before your window closes if you need to change an address.",
              },
            ].map(({ q, a }, i, arr) => (
              <details
                key={q}
                style={{
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,248,238,0.07)' : 'none',
                  background: 'rgba(255,248,238,0.02)',
                }}
                className="group"
              >
                <summary
                  style={{
                    padding: '1.1rem 1.5rem',
                    cursor: 'pointer',
                    listStyle: 'none',
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    userSelect: 'none',
                  }}
                  className="hover:text-[var(--ink)]"
                >
                  {q}
                  <span
                    style={{ flexShrink: 0, color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 300, display: 'inline-block', transition: 'transform 0.2s' }}
                    className="group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p style={{ padding: '0 1.5rem 1.1rem', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.85rem', color: 'var(--ink-2)', lineHeight: 1.75, margin: 0 }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-6 py-28 text-center">
        <div className="mx-auto" style={{ maxWidth: '36rem' }}>
          <div
            style={{
              width: 48, height: 48,
              borderRadius: 14,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.75rem',
            }}
          >
            <svg width="20" height="24" viewBox="0 0 12 14" fill="none">
              <path d="M6 0.5L11.5 3.5V7C11.5 10.0376 9.07614 12.7194 6 13.5C2.92386 12.7194 0.5 10.0376 0.5 7V3.5L6 0.5Z" fill="rgba(255,248,238,0.95)" />
            </svg>
          </div>

          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.8rem, 5vw, 2.75rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, color: 'var(--ink)', marginBottom: '1rem', textWrap: 'balance' }}>
            Make sure your POT<br />has a plan.
          </h2>
          <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.95rem', color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: '2.25rem' }}>
            Set up a vault, choose your beneficiaries, and keep the check-in rhythm that suits you.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', justifyContent: 'center' }}>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--accent)',
                color: '#0e0c0a',
                fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 600,
                fontSize: '0.88rem',
                padding: '0.8rem 2rem',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'filter 0.15s',
              }}
              className="hover:brightness-110"
            >
              Launch app <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          <p style={{ marginTop: '1.75rem', fontSize: '0.72rem', color: 'var(--subtle)', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}>
            Portaldot V3 testnet software — unaudited. Use test tokens only.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,248,238,0.07)', padding: '1.5rem 1.5rem', position: 'relative', zIndex: 10 }}>
        <div className="mx-auto" style={{ maxWidth: '52rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="9" height="11" viewBox="0 0 12 14" fill="none">
                <path d="M6 0.5L11.5 3.5V7C11.5 10.0376 9.07614 12.7194 6 13.5C2.92386 12.7194 0.5 10.0376 0.5 7V3.5L6 0.5Z" fill="rgba(255,248,238,0.95)" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink-2)', letterSpacing: '-0.01em' }}>SWITCH</span>
          </div>
          <p style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: '0.72rem', color: 'var(--subtle)', margin: 0 }}>
            Runs on{' '}
            <a href="https://www.portaldot.world/" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Portaldot V3</a>
            {' · '}Native asset: POT
          </p>
        </div>
      </footer>
    </div>
  )
}
