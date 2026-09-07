import { useAuth } from '@clerk/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  fetchMyTenants,
  useCurrentTenant,
  useTenantSwitcher,
  type TenantSummary,
} from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import { parseModuleIds } from '@/lib/modules/types'
import type { MeResponse } from '@/lib/types/me-types'
import { useLanguage } from '@/shell/providers/language-provider'

function normalizeMeResponse(raw: MeResponse): MeResponse {
  return {
    ...raw,
    modules: parseModuleIds(Array.isArray(raw.modules) ? raw.modules : []),
    trial_ends_at: raw.trial_ends_at ?? null,
    trial_expired: Boolean(raw.trial_expired),
    signup_intent: raw.signup_intent === 'growth' ? 'growth' : 'trial',
    payment_required: Boolean(raw.payment_required),
    has_stripe_customer: Boolean(raw.has_stripe_customer),
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    is_owner: Boolean(raw.is_owner),
    can_manage_roles: Boolean(raw.can_manage_roles),
    roles_used: raw.roles_used ?? 0,
    roles_limit: raw.roles_limit ?? null,
  }
}

type DefaultSwitchState = 'idle' | 'pending' | 'done'

const EMPTY_TENANTS: TenantSummary[] = []

export function meTenantsQueryKey() {
  return ['me', 'tenants'] as const
}

export function meProfileQueryKey(tenantId: string | null, role: string | null) {
  return ['me', 'profile', tenantId, role] as const
}

function messageFromUnknown(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

/**
 * Single bootstrap for the signed-in shell. Uses React Query so duplicate callers
 * share one /me + /me/tenants cache instead of each firing their own loop.
 */
export function useAppBootstrap(): {
  tenants: TenantSummary[]
  me: MeResponse | null
  refetchMe: () => Promise<void>
  error: string | null
  tenantsLoading: boolean
  meLoading: boolean
  resolvingSingleTenant: boolean
  tenantsReady: boolean
  retry: () => void
} {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { tenantId, role } = useCurrentTenant()
  const { switchTenant } = useTenantSwitcher()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const getTokenRef = useRef(getToken)

  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  const [switchError, setSwitchError] = useState<string | null>(null)
  const [defaultSwitchState, setDefaultSwitchState] = useState<DefaultSwitchState>('idle')

  const tenantsQuery = useQuery({
    queryKey: meTenantsQueryKey(),
    enabled: Boolean(isLoaded && isSignedIn),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async (): Promise<TenantSummary[]> => {
      return fetchMyTenants((a) => getTokenRef.current(a))
    },
  })

  const meQuery = useQuery({
    queryKey: meProfileQueryKey(tenantId, role),
    enabled: Boolean(isLoaded && isSignedIn && tenantId && role),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async (): Promise<MeResponse> => {
      const res = await apiFetch('/me', (a) => getTokenRef.current(a), {}, tenantId)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }
      return normalizeMeResponse((await res.json()) as MeResponse)
    },
  })

  const tenants = isSignedIn ? (tenantsQuery.data ?? EMPTY_TENANTS) : EMPTY_TENANTS
  // isLoading = first load only; background refetch must not remount the shell.
  const tenantsLoading = Boolean(isSignedIn) && tenantsQuery.isLoading
  const tenantsReady =
    !isLoaded || !isSignedIn || tenantsQuery.isFetched || tenantsQuery.isError
  const meLoading = Boolean(tenantId && role) && meQuery.isLoading

  const queryError = tenantsQuery.error
    ? messageFromUnknown(tenantsQuery.error, 'Failed to load tenants')
    : meQuery.error
      ? messageFromUnknown(meQuery.error, 'Request failed')
      : null

  // Once a tenant is active, treat auto-switch as idle without an effect.
  const switchState: DefaultSwitchState = tenantId ? 'idle' : defaultSwitchState

  const sessionSyncError =
    switchState === 'done' && !tenantId && tenants.length === 1
      ? shellT(lang, 'onboardingSessionSyncFailed')
      : null

  const error = switchError ?? queryError ?? sessionSyncError

  useEffect(() => {
    if (tenantId) return
    if (!isLoaded || !isSignedIn || tenants.length !== 1 || defaultSwitchState !== 'idle') {
      return
    }
    const onlyTenantId = tenants[0]?.tenant_id
    if (!onlyTenantId) return

    let cancelled = false
    // Defer state updates out of the effect body (react-hooks/set-state-in-effect).
    void Promise.resolve().then(async () => {
      if (cancelled) return
      setDefaultSwitchState('pending')
      try {
        await switchTenant(onlyTenantId)
        if (!cancelled) setDefaultSwitchState('done')
      } catch (e: unknown) {
        if (!cancelled) {
          setDefaultSwitchState('idle')
          setSwitchError(messageFromUnknown(e, 'Could not set default tenant'))
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, tenants, tenantId, switchTenant, defaultSwitchState])

  const refetchMe = useCallback(async () => {
    if (!tenantId || !role) return
    await queryClient.invalidateQueries({ queryKey: meProfileQueryKey(tenantId, role) })
  }, [queryClient, role, tenantId])

  const retry = useCallback(() => {
    setSwitchError(null)
    setDefaultSwitchState('idle')
    void queryClient.invalidateQueries({ queryKey: meTenantsQueryKey() })
    if (tenantId && role) {
      void queryClient.invalidateQueries({ queryKey: meProfileQueryKey(tenantId, role) })
    }
  }, [queryClient, role, tenantId])

  const resolvingSingleTenant =
    Boolean(isSignedIn) &&
    !tenantsLoading &&
    tenants.length === 1 &&
    !tenantId &&
    !error &&
    switchState === 'pending'

  return {
    tenants,
    me: meQuery.data ?? null,
    refetchMe,
    error,
    tenantsLoading,
    meLoading,
    resolvingSingleTenant,
    tenantsReady,
    retry,
  }
}
