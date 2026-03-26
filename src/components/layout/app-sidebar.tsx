import type { LucideIcon } from 'lucide-react'
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
import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'

import type { TenantSummary } from '@/auth/hooks'
import { CompanySwitcher } from '@/components/layout/company-switcher'
import { useLanguage } from '@/components/providers/language-provider'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { shellT } from '@/lib/shell-strings'
import { cn } from '@/lib/utils'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

type AppSidebarProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
  tenants: TenantSummary[]
  tenantId: string | null
  onTenantSelect: (id: string) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function NavSection({
  title,
  items,
  collapsed,
  onMobileClose,
}: {
  title: string
  items: NavItem[]
  collapsed: boolean
  onMobileClose: () => void
}) {
  return (
    <>
      <p
        className={cn(
          'mb-1 px-3 text-[11px] font-medium tracking-widest text-text-tertiary uppercase',
          collapsed && 'sr-only'
        )}
      >
        {title}
      </p>
      <nav className="flex flex-col gap-0.5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
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
    </>
  )
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
  const { lang } = useLanguage()

  const analyticsNav = useMemo<NavItem[]>(
    () => [
      {
        to: '/dashboard',
        label: shellT(lang, 'navDashboard'),
        icon: LayoutDashboardIcon,
      },
      {
        to: '/dashboard/expenses',
        label: shellT(lang, 'navExpenses'),
        icon: ReceiptIcon,
      },
    ],
    [lang],
  )

  const configNav = useMemo<NavItem[]>(
    () => [
      {
        to: '/dashboard/connections',
        label: shellT(lang, 'navConnections'),
        icon: PlugIcon,
      },
      {
        to: '/dashboard/billing',
        label: shellT(lang, 'navBilling'),
        icon: CreditCardIcon,
      },
      {
        to: '/dashboard/settings',
        label: shellT(lang, 'navSettings'),
        icon: SettingsIcon,
      },
    ],
    [lang],
  )

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
          'flex shrink-0 border-b border-border-subtle',
          collapsed
            ? 'flex-col items-center gap-1.5 px-2 py-2'
            : 'h-12 min-h-12 flex-row items-center justify-between gap-2 px-3'
        )}
      >
        <div
          className={cn(
            'min-w-0',
            collapsed ? 'flex w-full justify-center' : 'flex-1'
          )}
        >
          <CompanySwitcher
            tenants={tenants}
            tenantId={tenantId}
            onSelect={onTenantSelect}
            collapsed={collapsed}
            hideLabel
            className={collapsed ? '' : 'w-full min-w-0'}
          />
        </div>
        <div
          className={cn(
            'flex shrink-0 items-center gap-1',
            collapsed && 'w-full justify-center'
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={shellT(lang, 'ariaCloseNavMenu')}
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
            aria-label={
              collapsed
                ? shellT(lang, 'ariaExpandSidebar')
                : shellT(lang, 'ariaCollapseSidebar')
            }
          >
            {collapsed ? (
              <PanelLeftIcon className="size-4" />
            ) : (
              <PanelLeftCloseIcon className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-2 py-3">
            <NavSection
              title={shellT(lang, 'navSectionAnalytics')}
              items={analyticsNav}
              collapsed={collapsed}
              onMobileClose={onMobileClose}
            />
          </div>
        </ScrollArea>
        <Separator className="bg-border-subtle" />
        <div className="shrink-0 px-2 py-3">
          <NavSection
            title={shellT(lang, 'navSectionConfiguration')}
            items={configNav}
            collapsed={collapsed}
            onMobileClose={onMobileClose}
          />
        </div>
      </div>
    </aside>
  )
}
