import { useAuth } from '@clerk/react'
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
  }
}

type DefaultSwitchState = 'idle' | 'pending' | 'done'

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
  const getTokenRef = useRef(getToken)

  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [me, setMe] = useState<MeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Start true so AppShell never treats the empty initial state as "no workspace"
  // and bounce to /onboarding before the first /me/tenants response.
  const [tenantsLoading, setTenantsLoading] = useState(true)
  const [meLoading, setMeLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [defaultSwitchState, setDefaultSwitchState] = useState<DefaultSwitchState>('idle')
  const [tenantsReady, setTenantsReady] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setTenants([])
      setTenantsLoading(false)
      setTenantsReady(true)
      return
    }
    let cancelled = false
    setTenantsLoading(true)
    setTenantsReady(false)
    void fetchMyTenants((a) => getTokenRef.current(a))
      .then((list) => {
        if (!cancelled) setTenants(list)
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load tenants')
      })
      .finally(() => {
        if (!cancelled) {
          setTenantsLoading(false)
          setTenantsReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, retryCount])

  useEffect(() => {
    if (tenantId) {
      setDefaultSwitchState('idle')
      return
    }
    if (!isLoaded || !isSignedIn || tenants.length !== 1 || defaultSwitchState !== 'idle') {
      return
    }
    setDefaultSwitchState('pending')
    void switchTenant(tenants[0].tenant_id)
      .then(() => {
        setDefaultSwitchState('done')
      })
      .catch((e: unknown) => {
        setDefaultSwitchState('idle')
        setError(e instanceof Error ? e.message : 'Could not set default tenant')
      })
  }, [isLoaded, isSignedIn, tenants, tenantId, switchTenant, defaultSwitchState])

  useEffect(() => {
    if (defaultSwitchState === 'done' && !tenantId && tenants.length === 1 && !error) {
      setError(shellT(lang, 'onboardingSessionSyncFailed'))
    }
  }, [defaultSwitchState, tenantId, tenants.length, error, lang])

  const loadMe = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !tenantId || !role) {
      setMe(null)
      setMeLoading(false)
      return
    }
    setMeLoading(true)
    try {
      const res = await apiFetch('/me', (a) => getTokenRef.current(a), {}, tenantId)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }
      const data = normalizeMeResponse((await res.json()) as MeResponse)
      setMe(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setMeLoading(false)
    }
  }, [isLoaded, isSignedIn, tenantId, role])

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  const refetchMe = useCallback(async () => {
    await loadMe()
  }, [loadMe])

  const retry = useCallback(() => {
    setError(null)
    setDefaultSwitchState('idle')
    setRetryCount((c) => c + 1)
  }, [])

  const resolvingSingleTenant =
    Boolean(isSignedIn) &&
    !tenantsLoading &&
    tenants.length === 1 &&
    !tenantId &&
    !error &&
    defaultSwitchState === 'pending'

  return {
    tenants,
    me,
    refetchMe,
    error,
    tenantsLoading,
    meLoading,
    resolvingSingleTenant,
    tenantsReady,
    retry,
  }
}
