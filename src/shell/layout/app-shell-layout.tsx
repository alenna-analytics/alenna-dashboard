import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { formatTenantPlan } from '@/lib/utils'
import { AppBootLoader } from '@/shell/layout/app-boot-loader'
import { AppHeader } from '@/shell/layout/app-header'
import { AppSidebar } from '@/shell/layout/app-sidebar'
import { ShellBootstrapError } from '@/shell/layout/shell-bootstrap-error'
import { WorkspaceProvider } from '@/shell/providers/workspace-context'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { useLanguage } from '@/shell/providers/language-provider'
import { TooltipProvider } from '@/ui/tooltip'
import { WORKSPACE_SHELL_COLUMN_CLASS } from '@/shell/layout/workspace-shell-column'
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
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
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

  const sidebarCompanyName = useMemo(() => {
    const fromMe = me?.tenant_name?.trim()
    if (fromMe) return fromMe
    const row =
      tenants.find((x) => tenantIdsEqual(x.tenant_id, tenantId)) ??
      (tenants.length === 1 ? tenants[0] : undefined)
    const raw = row?.name?.trim()
    return raw && raw.length > 0 ? raw : shellT(lang, 'shellSidebarWorkspaceFallback')
  }, [me?.tenant_name, tenants, tenantId, lang])

  const sidebarCompanySubtitle = useMemo(() => {
    const fromMe = me?.plan?.trim()
    if (fromMe) return formatTenantPlan(fromMe)
    const row =
      tenants.find((x) => tenantIdsEqual(x.tenant_id, tenantId)) ??
      (tenants.length === 1 ? tenants[0] : undefined)
    const p = row?.plan?.trim()
    return p ? formatTenantPlan(p) : ''
  }, [me?.plan, tenants, tenantId])

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
      <TooltipProvider delayDuration={200}>
        <div className="motion-safe:animate-[boot-shell-enter_0.4s_ease-out] flex h-svh gap-3 overflow-hidden bg-[var(--bg-base)] px-3 py-3 lg:gap-4 lg:px-4 lg:py-4">
          <AppSidebar
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            companyName={sidebarCompanyName}
            companySubtitle={sidebarCompanySubtitle}
          />
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--shell-structure-border)] bg-white">
            <AppHeader className="border-b border-[var(--shell-structure-border)]" />
            <main
              ref={mainRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
            >
              <div
                className={cn(
                  WORKSPACE_SHELL_COLUMN_CLASS,
                  'min-h-full py-4 lg:py-5',
                )}
              >
                {!tenantId && tenants.length > 1 ? (
                  <p className="mb-4 text-sm text-text-secondary">
                    Select a workspace in your account menu if prompted.
                  </p>
                ) : null}
                <div
                  key={location.pathname}
                  className="flex min-h-full w-full flex-col motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:fill-mode-both"
                >
                  <Outlet />
                </div>
              </div>
            </main>
          </section>
        </div>
      </TooltipProvider>
    </WorkspaceProvider>
  )
}
