import {
  CreditCardIcon,
  LayoutDashboardIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  PlugIcon,
  ReceiptIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import type { TenantSummary } from '@/auth/hooks'
import { CompanySwitcher } from '@/components/layout/company-switcher'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { to: '/app/connectors', label: 'Connectors', icon: PlugIcon },
  { to: '/app/expenses', label: 'Expenses', icon: ReceiptIcon },
  { to: '/app/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/app/billing', label: 'Billing', icon: CreditCardIcon },
] as const

type AppSidebarProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
  tenants: TenantSummary[]
  tenantId: string | null
  onTenantSelect: (id: string) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  tenants,
  tenantId,
  onTenantSelect,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border-subtle bg-bg-surface transition-[width,transform] duration-200',
        'fixed inset-y-0 left-0 z-50 h-svh w-60 max-w-[85vw] -translate-x-full lg:static lg:z-auto lg:h-full lg:max-w-none lg:translate-x-0',
        mobileOpen && 'translate-x-0',
        collapsed ? 'lg:w-16' : 'lg:w-60'
      )}
    >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-border-subtle',
          collapsed ? 'justify-center px-2' : 'justify-between px-3'
        )}
      >
        {!collapsed ? (
          <span className="truncate pl-2 text-sm font-semibold tracking-tight text-text-primary">
            Ecom Analytics
          </span>
        ) : null}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Close navigation menu"
            onClick={onMobileClose}
          >
            <XIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftIcon className="size-4" />
            ) : (
              <PanelLeftCloseIcon className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="p-2">
        <CompanySwitcher
          tenants={tenants}
          tenantId={tenantId}
          onSelect={onTenantSelect}
          collapsed={collapsed}
        />
      </div>

      <Separator className="bg-border-subtle" />

      <ScrollArea className="flex-1 px-2 py-3">
        <p
          className={cn(
            'mb-1 px-3 text-[11px] font-medium tracking-widest text-text-tertiary uppercase',
            collapsed && 'sr-only'
          )}
        >
          Main
        </p>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                onMobileClose()
              }}
              className={({ isActive }) =>
                cn(
                  'relative flex h-9 items-center gap-3 rounded-lg text-sm transition-colors',
                  collapsed ? 'justify-center px-0 lg:justify-center' : 'px-3',
                  isActive
                    ? 'bg-accent/10 text-accent before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent before:content-[""]'
                    : 'text-text-secondary hover:bg-accent/5 hover:text-text-primary'
                )
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              {!collapsed ? label : null}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}
