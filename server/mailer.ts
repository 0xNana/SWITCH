import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'SWITCH <notifications@example.com>'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173').replace(/\/+$/, '')
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character)
}

function safeSubject(value: string) {
  return value.replace(/[\r\n\t]+/g, ' ').slice(0, 120)
}

function vaultUrl(vaultId: string) {
  return `${APP_URL}/vault/${encodeURIComponent(vaultId)}`
}

function inheritancesUrl() {
  return `${APP_URL}/inheritances`
}

function header() {
  return `<div style="background:#0e0c0a;padding:24px 32px;border-radius:16px 16px 0 0">
    <h1 style="margin:0;color:#f5efe4;font-size:22px;font-weight:700;letter-spacing:-0.03em">SWITCH</h1>
    <p style="margin:4px 0 0;color:rgba(245,239,228,0.65);font-size:13px">POT safety vault on Portaldot</p>
  </div>`
}

function footer() {
  return `<p style="margin:24px 0 0;font-size:12px;color:#77716a;line-height:1.6">
    SWITCH is unaudited testnet software, not a legal will. Use test tokens only.
  </p>`
}

export async function sendRegistrationEmail(opts: {
  to: string
  beneficiaryAddress: string
  vaultId: string
  vaultName: string
  ownerAddress: string
  sharePercent: string
}) {
  const name = escapeHtml(opts.vaultName)
  const owner = escapeHtml(`${opts.ownerAddress.slice(0, 10)}…${opts.ownerAddress.slice(-8)}`)
  const share = escapeHtml(opts.sharePercent)

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: safeSubject(`You've been named in "${opts.vaultName}" on SWITCH`),
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#27231f">
  ${header()}
  <div style="background:#fffcf7;padding:32px;border:1px solid rgba(39,35,31,0.1);border-top:none;border-radius:0 0 16px 16px">
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700">You've been named as a beneficiary</h2>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#514b44">A Portaldot vault named <strong>"${name}"</strong> has named you with a <strong>${share}%</strong> share.</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#514b44">No action is needed now. If the owner misses a check-in and the vault is later released, you'll receive an email with the next steps.</p>
    <div style="background:rgba(39,35,31,0.04);border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#77716a;text-transform:uppercase;letter-spacing:0.06em">Vault details</p>
      <p style="margin:0;font-size:13px">Vault ID: #${opts.vaultId}</p>
      <p style="margin:4px 0 0;font-size:13px;font-family:monospace">Owner: ${owner}</p>
      <p style="margin:4px 0 0;font-size:13px">Your share: ${share}%</p>
    </div>
    <a href="${vaultUrl(opts.vaultId)}" style="display:inline-block;background:#c8902a;color:#17130e;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600">View vault</a>
    ${footer()}
  </div>
</div>`,
  })
}

export async function sendReleaseEmail(opts: {
  to: string
  vaultId: string
  vaultName: string
  sharePercent: string
  payoutPot: string
}) {
  const name = escapeHtml(opts.vaultName)
  const share = escapeHtml(opts.sharePercent)
  const payout = escapeHtml(opts.payoutPot)

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: safeSubject(`Action available: "${opts.vaultName}" on SWITCH`),
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#27231f">
  ${header()}
  <div style="background:#fffcf7;padding:32px;border:1px solid rgba(39,35,31,0.1);border-top:none;border-radius:0 0 16px 16px">
    <div style="background:rgba(26,128,71,0.08);border:1px solid rgba(26,128,71,0.2);border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;font-weight:600;color:#1a8047">The vault is released. Your share is available to claim.</p>
    </div>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700">Your inheritance is ready</h2>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#514b44">The vault <strong>"${name}"</strong> (#${opts.vaultId}) has been released. Your <strong>${share}%</strong> share is approximately <strong>${payout} POT</strong>.</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#514b44">Anyone can submit a claim for you, or pay every beneficiary in one transaction. The person who submits the transaction pays the network fee in POT.</p>
    <a href="${vaultUrl(opts.vaultId)}" style="display:inline-block;background:#1a8047;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600">View and claim</a>
    <p style="margin:16px 0 0"><a href="${inheritancesUrl()}" style="font-size:13px;color:#6b6580">View your inheritances</a></p>
    ${footer()}
  </div>
</div>`,
  })
}

export async function sendDeadlineWarningEmail(opts: {
  to: string
  vaultId: string
  vaultName: string
  hoursLeft: number
}) {
  const name = escapeHtml(opts.vaultName)
  const hours = escapeHtml(String(opts.hoursLeft))

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: safeSubject(`Reminder: "${opts.vaultName}" check-in due in ${opts.hoursLeft}h`),
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#27231f">
  ${header()}
  <div style="background:#fffcf7;padding:32px;border:1px solid rgba(39,35,31,0.1);border-top:none;border-radius:0 0 16px 16px">
    <div style="background:rgba(200,144,42,0.1);border:1px solid rgba(200,144,42,0.24);border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;font-weight:600;color:#8a5c10">Check-in due in approximately ${hours} hours.</p>
    </div>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700">Time to check in</h2>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#514b44">Your vault <strong>"${name}"</strong> (#${opts.vaultId}) reaches its check-in deadline in about <strong>${hours} hours</strong>. After that, a 7-day grace period begins. Check in from the app to reset the clock.</p>
    <a href="${vaultUrl(opts.vaultId)}" style="display:inline-block;background:#c8902a;color:#17130e;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600">Check in</a>
    ${footer()}
  </div>
</div>`,
  })
}
