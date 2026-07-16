import { useAuth } from '@clerk/react'
import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { fetchMyTenants } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { ServiceErrorScreen } from '@/shell/service-error-screen'
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
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false
    void fetchMyTenants((a) => getTokenRef.current(a))
      .then((tenants) => {
        if (cancelled) return
        setError(false)
        setTarget(tenants.length === 0 ? 'onboarding' : 'dashboard')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        console.error('SessionGate fetchMyTenants failed', e)
        setTarget(null)
        setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [isLoaded])

  if (error) {
    return <ServiceErrorScreen lang={lang} />
  }

  if (!isLoaded || !target) {
    return (
      <main
        className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-white"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">{shellT(lang, 'bootLoadingLabel')}</span>
        <LoadingIcon className="size-5 animate-spin text-[color:var(--text-primary)]" />
      </main>
    )
  }

  if (target === 'onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return <Navigate to="/dashboard" replace />
}
