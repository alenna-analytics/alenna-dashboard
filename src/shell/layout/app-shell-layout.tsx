import { useEffect, useMemo, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { useCurrentTenant } from '@/auth/hooks'
import { AppBootLoader } from '@/shell/layout/app-boot-loader'
import { AppHeader } from '@/shell/layout/app-header'
import { AppSidebar } from '@/shell/layout/app-sidebar'
import { ShellBootstrapError } from '@/shell/layout/shell-bootstrap-error'
import { WorkspaceProvider } from '@/shell/providers/workspace-context'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { useLanguage } from '@/shell/providers/language-provider'

export function AppShellLayout() {
  const location = useLocation()
  const { lang } = useLanguage()
  const { tenantId } = useCurrentTenant()
  const {
    tenants,
    me,
    refetchMe,
    error,
    tenantsLoading,
    meLoading,
    resolvingSingleTenant,
    retry,
  } = useAppBootstrap()

  const workspaceValue = useMemo(() => ({ me, refetchMe }), [me, refetchMe])
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [location.pathname, location.search])

  const bootLoading =
    tenantsLoading || resolvingSingleTenant || (Boolean(tenantId) && meLoading)

  if (bootLoading) {
    return <AppBootLoader />
  }

  if (error) {
    return (
      <ShellBootstrapError
        lang={lang}
        error={error}
        isRetrying={tenantsLoading || meLoading}
        onRetry={retry}
      />
    )
  }

  return (
    <WorkspaceProvider value={workspaceValue}>
      <div className="flex h-svh overflow-hidden bg-transparent motion-safe:animate-[boot-shell-enter_0.4s_ease-out]">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-transparent">
          <AppHeader />
          <main
            ref={mainRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-transparent px-6 py-6 lg:px-10 lg:py-8"
          >
            {!tenantId && tenants.length > 1 ? (
              <p className="mb-4 text-sm text-text-secondary">
                Select a workspace in your account menu if prompted.
              </p>
            ) : null}
            <div
              key={location.pathname}
              className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  )
}
