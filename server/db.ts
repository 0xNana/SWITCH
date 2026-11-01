/**
 * server/db.ts — SQLite database layer (Bun's built-in :bun:sqlite)
 *
 * Rules (from docker skill):
 * - One process opens this file (server/index.ts imports this module, indexer
 *   runs in the same process — never open from two separate processes).
 * - WAL mode + FULL synchronous + busy_timeout for crash-safety on pause/resume.
 * - On integrity error: surface it and stop, never silently delete/rebuild.
 */

import { Database } from 'bun:sqlite'
import { join } from 'node:path'

const DB_PATH = process.env.DB_PATH ?? join(import.meta.dir, '..', 'data', 'switch.db')

// Ensure data directory exists
import { mkdirSync } from 'node:fs'
mkdirSync(join(import.meta.dir, '..', 'data'), { recursive: true })

export const db = new Database(DB_PATH, { create: true })

// Crash-safe pragmas
db.exec(`
  PRAGMA journal_mode=WAL;
  PRAGMA synchronous=FULL;
  PRAGMA busy_timeout=5000;
  PRAGMA foreign_keys=ON;
`)

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS beneficiary_emails (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    vault_id     TEXT    NOT NULL,
    beneficiary  TEXT    NOT NULL COLLATE NOCASE,
    email        TEXT    NOT NULL,
    registered_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(vault_id, beneficiary)
  );

  CREATE INDEX IF NOT EXISTS idx_be_vault   ON beneficiary_emails(vault_id);
  CREATE INDEX IF NOT EXISTS idx_be_email   ON beneficiary_emails(email);

  -- Track which notifications have been sent so we don't double-fire
  CREATE TABLE IF NOT EXISTS notifications_sent (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    vault_id     TEXT NOT NULL,
    event_type   TEXT NOT NULL,  -- 'deadline_warning' | 'released' | 'claimed'
    beneficiary  TEXT NOT NULL COLLATE NOCASE,
    sent_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(vault_id, event_type, beneficiary)
  );

  -- Indexer cursor: last block scanned per chain
  CREATE TABLE IF NOT EXISTS indexer_state (
    chain_id   INTEGER PRIMARY KEY,
    last_block INTEGER NOT NULL DEFAULT 0
  );
`)

// ── Prepared statements ──────────────────────────────────────────────────────

const upsertEmail = db.prepare(`
  INSERT INTO beneficiary_emails (vault_id, beneficiary, email)
  VALUES ($vault_id, $beneficiary, $email)
  ON CONFLICT(vault_id, beneficiary) DO UPDATE SET email = excluded.email
`)

const deleteEmail = db.prepare(`
  DELETE FROM beneficiary_emails WHERE vault_id = $vault_id AND beneficiary = $beneficiary
`)

const getEmailsForVault = db.prepare(`
  SELECT beneficiary, email FROM beneficiary_emails WHERE vault_id = $vault_id
`)

const getEmailForBeneficiary = db.prepare(`
  SELECT email FROM beneficiary_emails
  WHERE vault_id = $vault_id AND beneficiary = $beneficiary COLLATE NOCASE
`)

const markNotificationSent = db.prepare(`
  INSERT OR IGNORE INTO notifications_sent (vault_id, event_type, beneficiary)
  VALUES ($vault_id, $event_type, $beneficiary)
`)

const wasNotificationSent = db.prepare(`
  SELECT 1 FROM notifications_sent
  WHERE vault_id = $vault_id AND event_type = $event_type AND beneficiary = $beneficiary
`)

const getLastBlock = db.prepare(`
  SELECT last_block FROM indexer_state WHERE chain_id = $chain_id
`)

const upsertLastBlock = db.prepare(`
  INSERT INTO indexer_state (chain_id, last_block)
  VALUES ($chain_id, $last_block)
  ON CONFLICT(chain_id) DO UPDATE SET last_block = excluded.last_block
`)

// ── Public API ───────────────────────────────────────────────────────────────

export type BeneficiaryEmail = { beneficiary: string; email: string }

export function upsertBeneficiaryEmail(vaultId: string, beneficiary: string, email: string) {
  upsertEmail.run({ $vault_id: vaultId, $beneficiary: beneficiary.toLowerCase(), $email: email })
}

export function removeBeneficiaryEmail(vaultId: string, beneficiary: string) {
  deleteEmail.run({ $vault_id: vaultId, $beneficiary: beneficiary.toLowerCase() })
}

export function getVaultEmails(vaultId: string): BeneficiaryEmail[] {
  return getEmailsForVault.all({ $vault_id: vaultId }) as BeneficiaryEmail[]
}

export function getBeneficiaryEmail(vaultId: string, beneficiary: string): string | null {
  const row = getEmailForBeneficiary.get({
    $vault_id: vaultId,
    $beneficiary: beneficiary.toLowerCase(),
  }) as { email: string } | null
  return row?.email ?? null
}

export function recordNotificationSent(vaultId: string, eventType: string, beneficiary: string) {
  markNotificationSent.run({
    $vault_id: vaultId,
    $event_type: eventType,
    $beneficiary: beneficiary.toLowerCase(),
  })
}

export function hasNotificationBeenSent(vaultId: string, eventType: string, beneficiary: string): boolean {
  return !!wasNotificationSent.get({
    $vault_id: vaultId,
    $event_type: eventType,
    $beneficiary: beneficiary.toLowerCase(),
  })
}

export function getIndexerLastBlock(chainId: number): number {
  const row = getLastBlock.get({ $chain_id: chainId }) as { last_block: number } | null
  return row?.last_block ?? 0
}

export function setIndexerLastBlock(chainId: number, block: number) {
  upsertLastBlock.run({ $chain_id: chainId, $last_block: block })
}
