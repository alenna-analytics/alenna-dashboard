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
      <div className="flex h-svh gap-4 overflow-hidden bg-transparent px-4 py-4 motion-safe:animate-[boot-shell-enter_0.4s_ease-out] lg:gap-6 lg:px-6 lg:py-6">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-[2rem] border border-border-subtle bg-[rgba(255,251,245,0.26)] shadow-[0_18px_48px_rgba(84,89,61,0.06)] backdrop-blur-[2px]">
          <AppHeader />
          <main
            ref={mainRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-transparent px-5 py-5 lg:px-8 lg:py-8"
          >
            {!tenantId && tenants.length > 1 ? (
              <p className="mb-4 text-sm text-text-secondary">
                Select a workspace in your account menu if prompted.
              </p>
            ) : null}
            <div
              key={location.pathname}
              className="mx-auto w-full max-w-[1440px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  )
}
