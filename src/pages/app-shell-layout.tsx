import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { useCurrentTenant, useTenantSwitcher } from '@/auth/hooks'
import { AppBootLoader } from '@/components/layout/app-boot-loader'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'
import { cn } from '@/lib/utils'

export function AppShellLayout() {
  const { tenantId } = useCurrentTenant()
  const { switchTenant } = useTenantSwitcher()
  const {
    tenants,
    error,
    tenantsLoading,
    meLoading,
    resolvingSingleTenant,
  } = useAppBootstrap()
  const { collapsed, toggleCollapsed } = useSidebarCollapsed()
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const sidebarCollapsedUi = isLargeScreen && collapsed
  const drawerOpen = mobileNavOpen && !isLargeScreen

  useEffect(() => {
    if (!drawerOpen) {
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawerOpen])

  const bootLoading =
    tenantsLoading || resolvingSingleTenant || (Boolean(tenantId) && meLoading)

  if (bootLoading) {
    return <AppBootLoader />
  }

  return (
    <div className="flex h-svh overflow-hidden bg-bg-base">
      <button
        type="button"
        className={cn(
          'fixed inset-0 z-40 bg-bg-overlay transition-opacity lg:hidden',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!drawerOpen}
        aria-label="Close navigation menu"
        tabIndex={drawerOpen ? 0 : -1}
        onClick={() => {
          setMobileNavOpen(false)
        }}
      />
      <AppSidebar
        collapsed={sidebarCollapsedUi}
        onToggleCollapsed={toggleCollapsed}
        tenants={tenants}
        tenantId={tenantId}
        onTenantSelect={(id) => {
          void switchTenant(id).catch(() => {})
        }}
        mobileOpen={drawerOpen}
        onMobileClose={() => {
          setMobileNavOpen(false)
        }}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader
          onMenuClick={() => {
            setMobileNavOpen(true)
          }}
        />
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {error ? (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          ) : null}
          {!tenantId && tenants.length > 1 ? (
            <p className="text-sm text-text-secondary">
              Open the menu and select a company to continue.
            </p>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
