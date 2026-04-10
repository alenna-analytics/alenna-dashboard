import { useAuth } from '@clerk/react'
import { useCallback, useEffect, useState } from 'react'
import {
  fetchMyTenants,
  useCurrentTenant,
  useTenantSwitcher,
  type TenantSummary,
} from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { MeResponse } from '@/lib/types/me-types'

export function useAppBootstrap(): {
  tenants: TenantSummary[]
  me: MeResponse | null
  refetchMe: () => Promise<void>
  error: string | null
  tenantsLoading: boolean
  meLoading: boolean
  resolvingSingleTenant: boolean
  retry: () => void
} {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { tenantId, role } = useCurrentTenant()
  const { switchTenant } = useTenantSwitcher()
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [me, setMe] = useState<MeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [meLoading, setMeLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let cancelled = false
    setTenantsLoading(true)
    void fetchMyTenants((a) => getToken(a))
      .then((list) => {
        if (!cancelled) setTenants(list)
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load tenants')
      })
      .finally(() => {
        if (!cancelled) setTenantsLoading(false)
      })
    return () => {
      cancelled = true
    }
    // retryCount triggers re-fetch on manual retry
     
  }, [getToken, isLoaded, isSignedIn, retryCount])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || tenants.length !== 1 || tenantId) return
    void switchTenant(tenants[0].tenant_id).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Could not set default tenant')
    })
  }, [isLoaded, isSignedIn, tenants, tenantId, switchTenant])

  const loadMe = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !tenantId || !role) {
      setMe(null)
      setMeLoading(false)
      return
    }
    setMeLoading(true)
    try {
      const res = await apiFetch('/me', (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }
      const data = (await res.json()) as MeResponse
      setMe(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setMeLoading(false)
    }
  }, [getToken, isLoaded, isSignedIn, tenantId, role])

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  const refetchMe = useCallback(async () => {
    await loadMe()
  }, [loadMe])

  const retry = useCallback(() => {
    setError(null)
    setRetryCount((c) => c + 1)
  }, [])

  const resolvingSingleTenant =
    Boolean(isSignedIn) &&
    !tenantsLoading &&
    tenants.length === 1 &&
    !tenantId &&
    !error

  return {
    tenants,
    me,
    refetchMe,
    error,
    tenantsLoading,
    meLoading,
    resolvingSingleTenant,
    retry,
  }
}
