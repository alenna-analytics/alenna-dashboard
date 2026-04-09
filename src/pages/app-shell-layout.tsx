import { useEffect, useMemo, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { useCurrentTenant } from '@/auth/hooks'
import { AppBootLoader } from '@/components/layout/app-boot-loader'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { PageChromeProvider } from '@/components/providers/page-chrome-context'
import { WorkspaceProvider } from '@/components/providers/workspace-context'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'

export function AppShellLayout() {
  const location = useLocation()
  const { tenantId } = useCurrentTenant()
  const {
    tenants,
    me,
    refetchMe,
    error,
    tenantsLoading,
    meLoading,
    resolvingSingleTenant,
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

  return (
    <WorkspaceProvider value={workspaceValue}>
      <PageChromeProvider>
        <div className="flex h-svh overflow-hidden bg-bg-base motion-safe:animate-[boot-shell-enter_0.4s_ease-out]">
          <AppSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <AppHeader />
            <main
              ref={mainRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-bg-base px-6 py-6 lg:px-10 lg:py-8"
            >
              {error ? (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                >
                  {error}
                </div>
              ) : null}
              {!tenantId && tenants.length > 1 ? (
                <p className="mb-4 text-sm text-text-secondary">
                  Select a workspace in your account menu if prompted.
                </p>
              ) : null}
              <Outlet />
            </main>
          </div>
        </div>
      </PageChromeProvider>
    </WorkspaceProvider>
  )
}
