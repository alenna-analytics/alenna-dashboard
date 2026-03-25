import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import {
  fetchMyTenants,
  useCurrentTenant,
  useTenantSwitcher,
  type TenantSummary,
} from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { MeResponse } from '@/lib/me-types'

export function useAppBootstrap(): {
  tenants: TenantSummary[]
  me: MeResponse | null
  error: string | null
  tenantsLoading: boolean
  meLoading: boolean
  resolvingSingleTenant: boolean
} {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { tenantId, role } = useCurrentTenant()
  const { switchTenant } = useTenantSwitcher()
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [me, setMe] = useState<MeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [meLoading, setMeLoading] = useState(false)

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
  }, [getToken, isLoaded, isSignedIn])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || tenants.length !== 1 || tenantId) return
    void switchTenant(tenants[0].tenant_id).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Could not set default tenant')
    })
  }, [isLoaded, isSignedIn, tenants, tenantId, switchTenant])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !tenantId || !role) {
      setMe(null)
      setMeLoading(false)
      return
    }
    let cancelled = false
    setMeLoading(true)
    void (async () => {
      try {
        const res = await apiFetch('/me', (a) => getToken(a))
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || res.statusText)
        }
        const data = (await res.json()) as MeResponse
        if (!cancelled) setMe(data)
      } catch (e: unknown) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        if (!cancelled) setMeLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn, tenantId, role])

  const resolvingSingleTenant =
    Boolean(isSignedIn) &&
    !tenantsLoading &&
    tenants.length === 1 &&
    !tenantId &&
    !error

  return {
    tenants,
    me,
    error,
    tenantsLoading,
    meLoading,
    resolvingSingleTenant,
  }
}
