import { useAuth } from '@clerk/react'
import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { fetchMyTenants } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { LoadingIcon } from '@/ui/app-icon'

/**
 * Resolves where a signed-in user should land (onboarding vs dashboard).
 * Mount only under a signed-in gate (e.g. HomePage Show when="signed-in").
 */
export function SessionGate() {
  const { getToken, isLoaded } = useAuth()
  const { lang } = useLanguage()
  const getTokenRef = useRef(getToken)

  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])
  const [target, setTarget] = useState<'dashboard' | 'onboarding' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false
    void fetchMyTenants((a) => getTokenRef.current(a))
      .then((tenants) => {
        if (cancelled) return
        setTarget(tenants.length === 0 ? 'onboarding' : 'dashboard')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : shellT(lang, 'authGateError'))
      })
    return () => {
      cancelled = true
    }
  }, [isLoaded, lang])

  if (!isLoaded || (!target && !error)) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center gap-2 text-white/80">
        <LoadingIcon className="size-5 animate-spin" />
        <span className="text-sm">{shellT(lang, 'bootLoadingLabel')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[14px] bg-white/95 p-6 text-sm text-[color:var(--text-primary)] shadow-sm">
        <p>{error}</p>
      </div>
    )
  }

  if (target === 'onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return <Navigate to="/dashboard" replace />
}
