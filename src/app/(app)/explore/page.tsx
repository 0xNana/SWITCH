'use client'

import { useState } from 'react'
import { Search, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { VaultRow } from '@/components/VaultRow'
import { Btn } from '@/components/Btn'
import { useNextVaultId } from '@/hooks/useVault'

const PAGE_SIZE = 10

export default function ExplorePage() {
  const { data: nextId } = useNextVaultId()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const router = useRouter()

  const total = nextId ? Number(nextId) : 0
  const allIds = Array.from({ length: total }, (_, i) => BigInt(total - 1 - i))
  const pageIds = allIds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleSearch = () => {
    const n = parseInt(search.trim())
    if (!isNaN(n) && n >= 0 && n < total) router.push(`/vault/${n}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Explore</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            {total > 0
              ? `${total} vault${total !== 1 ? 's' : ''} on Portaldot V3`
              : 'No vaults yet — be the first'}
          </p>
        </div>
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{ background: 'rgba(15,35,54,0.06)' }}
        >
          <Globe className="size-5" style={{ color: 'var(--ink-2)' }} />
        </div>
      </div>

      {/* Search */}
      <Card inner className="flex items-center gap-2.5 px-4 py-2.5">
        <Search className="size-4 shrink-0" style={{ color: 'var(--subtle)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Jump to vault by ID…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--subtle)]"
          style={{ color: 'var(--ink)' }}
          type="number"
          min={0}
        />
        <Btn size="sm" onClick={handleSearch} disabled={!search.trim()}>Go</Btn>
      </Card>

      {/* Vault list */}
      {total === 0 ? (
        <Card className="p-12 text-center">
          <Globe className="mx-auto mb-4 size-10 opacity-20" style={{ color: 'var(--ink)' }} />
          <p className="display text-base font-semibold" style={{ color: 'var(--ink)' }}>No vaults yet</p>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--muted)' }}>Be the first to create one</p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {pageIds.map((id) => <VaultRow key={id.toString()} id={id} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Btn
                variant="secondary" size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Btn>
              <span className="text-sm tabular-nums" style={{ color: 'var(--muted)' }}>
                {page + 1} / {totalPages}
              </span>
              <Btn
                variant="secondary" size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next
              </Btn>
            </div>
          )}
        </>
      )}
    </div>
  )
}
