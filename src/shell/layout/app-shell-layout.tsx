import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { AppBootLoader } from '@/shell/layout/app-boot-loader'
import { AppHeader } from '@/shell/layout/app-header'
import { AppSidebar } from '@/shell/layout/app-sidebar'
import { AppSidebarDrawer } from '@/shell/layout/app-sidebar-drawer'
import { ShellBootstrapError } from '@/shell/layout/shell-bootstrap-error'
import { DisplayCurrencyProvider } from '@/shell/providers/display-currency-provider'
import { GlobalActivityProvider } from '@/shell/providers/global-activity-provider'
import { WorkspaceProvider } from '@/shell/providers/workspace-context'
import { ActiveAlertsSheetHost } from '@/shell/alerts/active-alerts-sheet-host'
import { AlertsSheetProvider } from '@/shell/alerts/alerts-sheet-context'
import { GlobalActivityBar } from '@/shell/layout/global-activity-bar'
import { CogsBackfillActivityPollers } from '@/shell/layout/cogs-backfill-activity-pollers'
import { TrialExpiredScreen } from '@/shell/trial-expired-screen'
import { onTrialExpired } from '@/lib/trial-expired-signal'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { useLanguage } from '@/shell/providers/language-provider'
import { TooltipProvider } from '@/ui/tooltip'
import { WORKSPACE_SHELL_COLUMN_CLASS } from '@/shell/layout/workspace-shell-column'
import { ConfigurationInternalSidebar } from '@/pages/configuration/configuration-internal-sidebar'
import { isConfigurationRoute } from '@/pages/configuration/configuration-inner-nav'
import { cn } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'alenna.sidebar.collapsed'

function tenantIdsEqual(a: string, b: string | null | undefined): boolean {
  if (!a || !b) return false
  return a.replace(/-/g, '').toLowerCase() === b.replace(/-/g, '').toLowerCase()
}

function readInitialSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function AppShellLayout() {
  const location = useLocation()
  const { lang } = useLanguage()
  const { tenantId } = useCurrentTenant()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readInitialSidebarCollapsed)
  const [mobileNavPath, setMobileNavPath] = useState<string | null>(null)
  const [trialForced, setTrialForced] = useState(false)

  const mobileNavOpen = mobileNavPath === location.pathname
  const setMobileNavOpen = useCallback((open: boolean) => {
    setMobileNavPath(open ? location.pathname : null)
  }, [location.pathname])
  const openMobileNav = useCallback(() => {
    setMobileNavPath(location.pathname)
  }, [location.pathname])

  useEffect(() => onTrialExpired(() => setTrialForced(true)), [])
  const toggleSidebar = useCallback(() => {
    startTransition(() => {
      setSidebarCollapsed((c) => {
        const next = !c
        try {
          window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
        } catch {
          /* ignore */
        }
        return next
      })
    })
  }, [])
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

  const companyName = useMemo(() => {
    const fromMe = me?.tenant_name?.trim()
    if (fromMe) return fromMe
    const row =
      tenants.find((x) => tenantIdsEqual(x.tenant_id, tenantId)) ??
      (tenants.length === 1 ? tenants[0] : undefined)
    const raw = row?.name?.trim()
    return raw && raw.length > 0 ? raw : shellT(lang, 'shellSidebarWorkspaceFallback')
  }, [me?.tenant_name, tenants, tenantId, lang])

  const showConfigurationInnerSidebar = isConfigurationRoute(location.pathname)

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

  if (me?.trial_expired || trialForced) {
    return <TrialExpiredScreen />
  }

  return (
    <WorkspaceProvider value={workspaceValue}>
      <DisplayCurrencyProvider me={me} refetchMe={refetchMe}>
        <GlobalActivityProvider>
          <CogsBackfillActivityPollers />
          <AlertsSheetProvider>
            <TooltipProvider delayDuration={200}>
              <div className="motion-safe:animate-[boot-shell-enter_0.4s_ease-out] flex h-svh flex-col overflow-hidden bg-white">
                <div className="z-40 shrink-0">
                  <GlobalActivityBar />
                </div>
                <div className="sticky top-0 z-30 shrink-0 bg-white">
                  <AppHeader companyName={companyName} onOpenMobileNav={openMobileNav} />
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
                  <AppSidebar
                    className="hidden lg:flex"
                    collapsed={sidebarCollapsed}
                    onToggle={toggleSidebar}
                  />
                  <AppSidebarDrawer
                    open={mobileNavOpen}
                    onOpenChange={setMobileNavOpen}
                  />
                  <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
                    {showConfigurationInnerSidebar ? <ConfigurationInternalSidebar /> : null}
                    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
                      <main
                        ref={mainRef}
                        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
                      >
                        <div
                          className={cn(
                            WORKSPACE_SHELL_COLUMN_CLASS,
                            'min-h-full py-3 lg:py-4',
                          )}
                        >
                          {!tenantId && tenants.length > 1 ? (
                            <p className="mb-4 text-sm text-text-secondary">
                              Select a workspace in your account menu if prompted.
                            </p>
                          ) : null}
                          <div
                            key={location.pathname}
                            className="flex min-h-full w-full flex-col motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-safe:fill-mode-both"
                          >
                            <Outlet />
                          </div>
                        </div>
                      </main>
                    </section>
                    <ActiveAlertsSheetHost />
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </AlertsSheetProvider>
        </GlobalActivityProvider>
      </DisplayCurrencyProvider>
    </WorkspaceProvider>
  )
}
