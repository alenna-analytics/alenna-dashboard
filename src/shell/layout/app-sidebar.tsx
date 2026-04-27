import type { LucideIcon } from 'lucide-react'
import { BarChart2, LayoutDashboard, Link2, PanelLeftClose, PanelLeft } from 'lucide-react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'

import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

type AppSidebarProps = {
  collapsed: boolean
  onToggle: () => void
}

function linkClassNames(isActive: boolean, collapsed: boolean): string {
  const baseTrans =
    'text-sm font-medium transition-[background-color,color,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
  const active = cn(
    'bg-primary text-primary-foreground shadow-none',
    '[&_svg]:text-primary-foreground [&_svg]:opacity-100',
  )
  const inactive = cn(
    'text-text-secondary hover:bg-brand-dim hover:text-text-primary',
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
    'flex items-center gap-3 rounded-sm px-4 py-1.5',
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
  // String className is required: Radix TooltipTrigger (Slot) + NavLink breaks function className, so active bg is lost.
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

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const toggleAria = collapsed ? t('ariaExpandSidebar') : t('ariaCollapseSidebar')

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col transition-[width] duration-200 ease-out',
        collapsed ? 'w-[4.5rem]' : 'w-60',
      )}
    >
      <div
        className={cn(
          'flex h-full min-h-0 flex-col rounded-[2rem] border border-border-default bg-bg-elevated/90 shadow-none',
          collapsed ? 'p-3 pt-5 sm:pt-6' : 'p-3 sm:p-4',
        )}
      >
        <div
          className={cn(
            'flex w-full shrink-0',
            collapsed ? 'flex-col items-center gap-3' : 'h-16 flex-row items-center gap-2 px-1',
          )}
        >
          <div
            className={cn(
              'flex items-center',
              collapsed ? 'w-full justify-center' : 'min-w-0 flex-1 gap-3',
            )}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-none">
              A
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-text-primary">
                  {t('bootBrandName')}
                </p>
              </div>
            ) : null}
          </div>
          <div className={cn('flex w-full justify-center', !collapsed && 'w-auto shrink-0')}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label={toggleAria}
              className={cn(
                'shrink-0 text-text-secondary shadow-none hover:text-text-primary',
                collapsed && 'size-9',
              )}
            >
              {collapsed ? <PanelLeft className="size-4" aria-hidden /> : <PanelLeftClose className="size-4" aria-hidden />}
            </Button>
          </div>
        </div>
        <div className={cn('h-px w-full shrink-0 bg-border-subtle', collapsed ? 'mb-1.5 mt-1' : 'mb-3 mt-2')} aria-hidden />
        <nav
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            collapsed ? 'w-full items-center gap-1' : 'gap-1 p-1 pt-0',
          )}
          aria-label={t('navMain')}
        >
          <NavItem Icon={LayoutDashboard} to="/dashboard" end label={t('navDashboard')} collapsed={collapsed} />
          <NavItem Icon={BarChart2} to="/dashboard/reports" label={t('navReports')} collapsed={collapsed} />
          <NavItem Icon={Link2} to="/dashboard/integrations" label={t('navIntegrations')} collapsed={collapsed} />
        </nav>
        {!collapsed ? (
          <div className="rounded-[1.5rem] border border-border-subtle bg-bg-section px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
              {t('bootBrandName')}
            </p>
            <p className="mt-1 text-sm font-medium text-text-primary">{t('navReports')}</p>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
