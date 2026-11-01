'use client'

import { useCallback, useEffect, useState } from 'react'
import { PORTALDOT_CHAIN_ID } from '@/lib/contract'

export type EmailRole = 'beneficiary' | 'owner'

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || '/api'

export function emailSignatureMessage(
  action: 'register' | 'unregister' | 'owner-register' | 'owner-unregister',
  vaultId: string,
  account: string,
  email?: string,
) {
  return `SWITCH_EMAIL_V1:${PORTALDOT_CHAIN_ID}:${action}:${vaultId}:${account.toLowerCase()}:${email?.trim().toLowerCase() ?? ''}`
}

export function useEmailForAddress(vaultId: string, address: string, role: EmailRole) {
  const [hasEmail, setHasEmail] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const route = role === 'owner' ? 'owner-email' : 'emails'

  const refetch = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API}/${route}/${vaultId}/${address}`)
      const data = await response.json() as { registered?: boolean }
      setHasEmail(response.ok && data.registered === true)
    } catch {
      setHasEmail(false)
    } finally {
      setIsLoading(false)
    }
  }, [address, route, vaultId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  async function register(email: string, signature: string): Promise<boolean> {
    setIsMutating(true)
    try {
      const body = role === 'owner'
        ? { vaultId, owner: address, email, signature }
        : { vaultId, beneficiary: address, email, signature }
      const response = await fetch(`${API}/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (response.ok) setHasEmail(true)
      return response.ok
    } catch {
      return false
    } finally {
      setIsMutating(false)
    }
  }

  async function unregister(signature: string): Promise<boolean> {
    setIsMutating(true)
    try {
      const body = role === 'owner'
        ? { vaultId, owner: address, signature }
        : { vaultId, beneficiary: address, signature }
      const response = await fetch(`${API}/${route}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (response.ok) setHasEmail(false)
      return response.ok
    } catch {
      return false
    } finally {
      setIsMutating(false)
    }
  }

  return { hasEmail, isLoading, isMutating, register, unregister }
}
