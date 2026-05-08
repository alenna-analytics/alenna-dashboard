import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Link2, PanelLeft, Tag } from 'lucide-react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'

import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { shellT } from '@/lib/i18n/shell-strings'
import { SidebarNavSection } from '@/shell/layout/sidebar-nav-section'
import { Button } from '@/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

type AppSidebarProps = {
  collapsed: boolean
  onToggle: () => void
  companyName: string
  companySubtitle: string
}

function linkClassNames(isActive: boolean, collapsed: boolean): string {
  const baseTrans =
    'text-sm font-medium transition-[background-color,color,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
  const active = cn(
    'bg-none text-[var(--sidebar-active-foreground)] font-bold shadow-none',
    '[&_svg]:text-[var(--sidebar-active-foreground)] [&_svg]:opacity-100',
  )
  const inactive = cn(
    'text-text-secondary hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]',
    !collapsed && '[&_svg]:opacity-75',
    !collapsed && 'hover:[&_svg]:opacity-100',
  )
  if (collapsed) {
    return cn(
      baseTrans,
      'flex size-8 shrink-0 items-center justify-center rounded-sm',
      isActive ? active : inactive,
    )
  }
  return cn(
    baseTrans,
    'flex items-center gap-2 rounded-sm px-1 py-1.5',
    isActive ? active : inactive,
  )
}

function iconClassNames(isActive: boolean, collapsed: boolean): string {
  return cn(
    'size-4 shrink-0 transition-[color,opacity] duration-200',
    collapsed && (isActive ? 'text-primary-foreground opacity-100' : 'text-text-secondary opacity-100'),
  )
}

function NavItem({
  to,
  end,
  label,
  collapsed,
  Icon,
}: {
  to: string
  end?: boolean
  label: string
  collapsed: boolean
  Icon: LucideIcon
}) {
  const { pathname } = useLocation()
  const isActive = matchPath({ path: to, end: Boolean(end) }, pathname) != null
  const link = (
    <NavLink to={to} end={end} className={linkClassNames(isActive, collapsed)}>
      <Icon
        className={iconClassNames(isActive, collapsed)}
        aria-hidden
        strokeWidth={2}
      />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </NavLink>
  )

  if (!collapsed) {
    return link
  }

  return (
    <div className="flex w-full min-w-0 shrink-0 justify-center px-0 py-px">
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="max-w-[12rem]">
          {label}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function TenantMark({ name, className }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '·'
  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-text-primary)] text-sm font-bold text-white',
        className,
      )}
      aria-hidden
    >
      {initial}
    </div>
  )
}

export function AppSidebar({ collapsed, onToggle, companyName, companySubtitle }: AppSidebarProps) {
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const toggleAria = collapsed ? t('ariaExpandSidebar') : t('ariaCollapseSidebar')

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col transition-[width] duration-200 ease-out',
        collapsed ? 'w-[3.75rem]' : 'w-48',
      )}
    >
      <div
        className={cn(
          'flex h-full min-h-0 flex-col rounded-md border border-[var(--shell-structure-border)] bg-white shadow-none',
          collapsed ? 'p-2.5 pt-3' : 'p-2.5',
        )}
      >
        <div
          className={cn(
            'flex w-full shrink-0 items-center border-b border-[var(--shell-structure-border)] pb-2.5',
            collapsed ? 'flex-col gap-2' : 'gap-2',
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <TenantMark name={companyName} className="size-8 text-xs" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="max-w-[14rem]">
                <p className="font-medium">{companyName}</p>
                {companySubtitle ? <p className="text-xs text-text-tertiary">{companySubtitle}</p> : null}
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <TenantMark name={companyName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight text-text-primary">{companyName}</p>
                {companySubtitle ? (
                  <p className="mt-0.5 truncate text-xs text-text-tertiary leading-tight">{companySubtitle}</p>
                ) : null}
              </div>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onToggle}
            aria-label={toggleAria}
            className={cn(
              'h-8 w-8 shrink-0 border-[var(--shell-structure-border)] bg-[var(--bg-base)]/30 text-text-secondary shadow-none hover:bg-[var(--bg-base)]/50 hover:text-text-primary',
              collapsed && 'w-8',
            )}
          >
            <PanelLeft className="size-4" aria-hidden />
          </Button>
        </div>

        <nav
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            collapsed ? 'mt-2 w-full items-center gap-1' : 'mt-2 gap-1 p-0.5 pt-1',
          )}
          aria-label={t('navMain')}
        >
          <NavItem Icon={LayoutDashboard} to="/dashboard" end label={t('navHome')} collapsed={collapsed} />
          <NavItem Icon={Tag} to="/dashboard/products" label={t('navProductCatalog')} collapsed={collapsed} />
          <SidebarNavSection collapsed={collapsed} sectionTitle={t('navSectionConfiguration')}>
            <NavItem Icon={Link2} to="/dashboard/integrations" label={t('navIntegrations')} collapsed={collapsed} />
          </SidebarNavSection>
        </nav>
      </div>
    </aside>
  )
}
