import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { AppShellBootSkeleton } from '@/shell/layout/app-shell-boot-skeleton'
import { AppHeader } from '@/shell/layout/app-header'
import { AppSidebar } from '@/shell/layout/app-sidebar'
import { AppSidebarDrawer } from '@/shell/layout/app-sidebar-drawer'
import { ShellBootstrapError } from '@/shell/layout/shell-bootstrap-error'
import { DisplayCurrencyProvider } from '@/shell/providers/display-currency-provider'
import { GlobalActivityProvider } from '@/shell/providers/global-activity-provider'
import { WorkspaceProvider } from '@/shell/providers/workspace-context'
import { AccountDeletionPendingShellBanner } from '@/shell/account-deletion-pending-shell-banner'
import { FixtureTenantBanner } from '@/shell/fixture-tenant-banner'
import { ActiveAlertsSheetHost } from '@/shell/alerts/active-alerts-sheet-host'
import { AlertsInvalidationHost } from '@/shell/alerts/alerts-invalidation-host'
import { AlertsSheetProvider } from '@/shell/alerts/alerts-sheet-context'
import { GlobalActivityBar } from '@/shell/layout/global-activity-bar'
import { CogsBackfillActivityPollers } from '@/shell/layout/cogs-backfill-activity-pollers'
import { PlatformSyncActivityHost } from '@/shell/layout/platform-sync-activity-host'
import { PlanLimitShellBanner } from '@/shell/plan-limit-shell-banner'
import { PaymentPendingScreen } from '@/shell/payment-pending-screen'
import { TrialExpiredScreen } from '@/shell/trial-expired-screen'
import {
  onPaymentRequired,
  onSubscriptionAlreadyActive,
  onTrialExpired,
} from '@/lib/trial-expired-signal'
import { shouldShowPaymentPending, shouldShowTrialExpired } from '@/lib/plan/shell-gates'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { useLanguage } from '@/shell/providers/language-provider'
import { TooltipProvider } from '@/ui/tooltip'
import { shellMainColumnClassName } from '@/shell/layout/shell-main-padding'
import { ConfigurationInternalSidebar } from '@/pages/configuration/configuration-internal-sidebar'
import { isConfigurationRoute } from '@/pages/configuration/configuration-inner-nav'
import { IntegrationsInternalSidebar } from '@/pages/integrations/dashboard/integrations-internal-sidebar'
import { isIntegrationsRoute } from '@/pages/integrations/dashboard/integrations-inner-nav'
import { ProductsInternalSidebar } from '@/pages/products/products-internal-sidebar'
import { isProductsRoute } from '@/pages/products/products-inner-nav'
import { TeamInternalSidebar } from '@/pages/team/team-internal-sidebar'
import { isTeamRoute } from '@/pages/team/team-inner-nav'
import {
  isSidebarVisuallyCollapsed,
  readSidebarControlMode,
  writeSidebarControlMode,
  type SidebarControlMode,
} from '@/lib/shell/sidebar-control-prefs'

const CONFIGURATION_GENERAL_PATH = '/dashboard/configuration/general'

function tenantIdsEqual(a: string, b: string | null | undefined): boolean {
  if (!a || !b) return false
  return a.replace(/-/g, '').toLowerCase() === b.replace(/-/g, '').toLowerCase()
}

function readInitialSidebarControlMode(): SidebarControlMode {
  return readSidebarControlMode()
}

export function AppShellLayout() {
  const location = useLocation()
  const { lang } = useLanguage()
  const { tenantId } = useCurrentTenant()
  const [sidebarControlMode, setSidebarControlMode] = useState(readInitialSidebarControlMode)
  const [sidebarHoverExpanded, setSidebarHoverExpanded] = useState(false)
  const [mobileNavPath, setMobileNavPath] = useState<string | null>(null)
  const [trialForced, setTrialForced] = useState(false)
  const [paymentForced, setPaymentForced] = useState(false)
  const [subscriptionAlreadyActive, setSubscriptionAlreadyActive] = useState(false)

  const sidebarCollapsed = isSidebarVisuallyCollapsed(sidebarControlMode, sidebarHoverExpanded)

  const mobileNavOpen = mobileNavPath === location.pathname
  const setMobileNavOpen = useCallback((open: boolean) => {
    setMobileNavPath(open ? location.pathname : null)
  }, [location.pathname])
  const openMobileNav = useCallback(() => {
    setMobileNavPath(location.pathname)
  }, [location.pathname])

  useEffect(() => onTrialExpired(() => {
    setSubscriptionAlreadyActive(false)
    setTrialForced(true)
  }), [])
  useEffect(() => onPaymentRequired(() => {
    setSubscriptionAlreadyActive(false)
    setPaymentForced(true)
  }), [])
  useEffect(
    () =>
      onSubscriptionAlreadyActive(() => {
        setSubscriptionAlreadyActive(true)
        setTrialForced(false)
        setPaymentForced(false)
      }),
    [],
  )

  const setSidebarControlModePersisted = useCallback((mode: SidebarControlMode) => {
    writeSidebarControlMode(mode)
    setSidebarControlMode(mode)
    if (mode !== 'expand_on_hover') {
      setSidebarHoverExpanded(false)
    }
  }, [])

  const onSidebarMouseEnter = useCallback(() => {
    if (sidebarControlMode === 'expand_on_hover') {
      setSidebarHoverExpanded(true)
    }
  }, [sidebarControlMode])

  const onSidebarMouseLeave = useCallback(() => {
    if (sidebarControlMode === 'expand_on_hover') {
      setSidebarHoverExpanded(false)
    }
  }, [sidebarControlMode])
  const {
    tenants,
    me,
    refetchMe,
    error,
    tenantsLoading,
    meLoading,
    resolvingSingleTenant,
    tenantsReady,
    retry: refetchTenants,
  } = useAppBootstrap()

  useEffect(() => {
    if (!paymentForced && !trialForced) return
    void refetchMe()
  }, [paymentForced, trialForced, refetchMe])

  const workspaceValue = useMemo(
    () => ({ me, refetchMe, refetchTenants }),
    [me, refetchMe, refetchTenants],
  )
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
  const showIntegrationsInnerSidebar = isIntegrationsRoute(location.pathname)
  const showProductsInnerSidebar = isProductsRoute(location.pathname)
  const showTeamInnerSidebar = isTeamRoute(location.pathname)

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [location.pathname, location.search])

  const bootLoading =
    !tenantsReady ||
    tenantsLoading ||
    resolvingSingleTenant ||
    (Boolean(tenantId) && meLoading)

  if (bootLoading) {
    return <AppShellBootSkeleton />
  }

  if (tenantsReady && !tenantsLoading && tenants.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  if (error) {
    return <ShellBootstrapError lang={lang} />
  }

  const billingUnlocked = Boolean(me?.has_stripe_subscription)
  const showPaymentPending =
    !billingUnlocked &&
    !subscriptionAlreadyActive &&
    shouldShowPaymentPending(me, paymentForced)
  const showTrialExpired =
    !billingUnlocked &&
    !subscriptionAlreadyActive &&
    shouldShowTrialExpired(me, trialForced)

  if (showPaymentPending) {
    return (
      <WorkspaceProvider value={workspaceValue}>
        <PaymentPendingScreen />
      </WorkspaceProvider>
    )
  }

  if (showTrialExpired) {
    return (
      <WorkspaceProvider value={workspaceValue}>
        <TrialExpiredScreen />
      </WorkspaceProvider>
    )
  }

  if (
    me?.account_deletion_status === 'pending' &&
    location.pathname !== CONFIGURATION_GENERAL_PATH
  ) {
    return <Navigate to={CONFIGURATION_GENERAL_PATH} replace />
  }

  return (
    <WorkspaceProvider value={workspaceValue}>
      <DisplayCurrencyProvider me={me} refetchMe={refetchMe}>
        <GlobalActivityProvider>
          <CogsBackfillActivityPollers />
          <PlatformSyncActivityHost />
          <AlertsSheetProvider>
            <AlertsInvalidationHost />
            <TooltipProvider delayDuration={200}>
              <div className="motion-safe:animate-[boot-shell-enter_0.4s_ease-out] flex h-svh flex-col overflow-hidden bg-white">
                <div className="z-40 shrink-0">
                  <GlobalActivityBar />
                </div>
                <div className="sticky top-0 z-30 shrink-0 bg-white">
                  {me?.is_fixture ? <FixtureTenantBanner /> : null}
                  <PlanLimitShellBanner />
                  <AccountDeletionPendingShellBanner />
                  <AppHeader
                    onOpenMobileNav={openMobileNav}
                    companyName={companyName}
                    me={me}
                  />
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
                  <AppSidebar
                    className="hidden lg:flex"
                    collapsed={sidebarCollapsed}
                    controlMode={sidebarControlMode}
                    onControlModeChange={setSidebarControlModePersisted}
                    onMouseEnter={onSidebarMouseEnter}
                    onMouseLeave={onSidebarMouseLeave}
                  />
                  <AppSidebarDrawer
                    open={mobileNavOpen}
                    onOpenChange={setMobileNavOpen}
                  />
                  <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
                    {showConfigurationInnerSidebar ? <ConfigurationInternalSidebar /> : null}
                    {showIntegrationsInnerSidebar ? <IntegrationsInternalSidebar /> : null}
                    {showProductsInnerSidebar ? <ProductsInternalSidebar /> : null}
                    {showTeamInnerSidebar ? <TeamInternalSidebar /> : null}
                    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
                      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
                        <main
                          ref={mainRef}
                          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
                        >
                          <div className={shellMainColumnClassName(location.pathname)}>
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
              </div>
            </TooltipProvider>
          </AlertsSheetProvider>
        </GlobalActivityProvider>
      </DisplayCurrencyProvider>
    </WorkspaceProvider>
  )
}
