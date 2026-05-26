import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, PanelLeft } from 'lucide-react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'

import { useEnabledModules } from '@/lib/modules/use-modules'
import type { ModuleSection, ModuleState } from '@/lib/modules/types'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { shellT } from '@/lib/i18n/shell-strings'
import { SidebarNavSection } from '@/shell/layout/sidebar-nav-section'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

export type AppSidebarPanelProps = {
  collapsed: boolean
  companyName: string
  companySubtitle: string
  onToggle?: () => void
  hideCollapseToggle?: boolean
  onNavigate?: () => void
  className?: string
}

function linkClassNames(isActive: boolean, collapsed: boolean): string {
  const baseTrans =
    'text-xs font-medium transition-[background-color,color,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
  const active = cn(
    'bg-[var(--sidebar-active-bg)] font-medium shadow-none',
    '[&_svg]:opacity-100',
  )
  const inactive = cn(
    'text-text-secondary hover:bg-[var(--sidebar-accent)]',
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
    'w-full flex items-center gap-2 rounded-sm px-2 py-1.5',
    isActive ? active : inactive,
  )
}

function iconClassNames(isActive: boolean, collapsed: boolean): string {
  return cn(
    'size-3.5 shrink-0 transition-[color,opacity] duration-200',
    collapsed &&
    (isActive ? 'opacity-100' : 'text-text-secondary opacity-100'),
  )
}

function NavItem({
  to,
  end,
  label,
  collapsed,
  Icon,
  comingSoon,
  comingSoonLabel,
  onNavigate,
}: {
  to: string
  end?: boolean
  label: string
  collapsed: boolean
  Icon: LucideIcon
  comingSoon?: boolean
  comingSoonLabel?: string
  onNavigate?: () => void
}) {
  const { pathname } = useLocation()
  const isActive = matchPath({ path: to, end: Boolean(end) }, pathname) != null
  const link = (
    <NavLink
      to={to}
      end={end}
      className={linkClassNames(isActive, collapsed)}
      onClick={() => onNavigate?.()}
    >
      <Icon className={iconClassNames(isActive, collapsed)} aria-hidden strokeWidth={2} />
      {!collapsed ? (
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {comingSoon && comingSoonLabel ? (
            <Badge
              variant="info"
              className="ml-auto h-5 shrink-0 px-1.5 py-0 text-[10px] font-medium"
            >
              {comingSoonLabel}
            </Badge>
          ) : null}
        </span>
      ) : null}
    </NavLink>
  )

  const tooltipLabel =
    comingSoon && comingSoonLabel ? `${label} · ${comingSoonLabel}` : label

  if (!collapsed) {
    return link
  }

  return (
    <div className="flex w-full min-w-0 shrink-0 justify-center px-0 py-px">
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="max-w-[12rem]">
          {tooltipLabel}
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
        'flex size-9 shrink-0 items-center justify-center rounded-sm bg-[var(--color-text-primary)] text-sm font-bold text-white',
        className,
      )}
      aria-hidden
    >
      {initial}
    </div>
  )
}

function ModuleNavItems({
  modules,
  collapsed,
  onNavigate,
}: {
  modules: ModuleState[]
  collapsed: boolean
  onNavigate?: () => void
}) {
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const comingSoonLabel = t('comingSoonBadge')

  return (
    <>
      {modules.map((mod) => (
        <NavItem
          key={mod.id}
          Icon={mod.icon}
          to={mod.path}
          end={mod.id !== 'products'}
          label={t(mod.labelKey)}
          collapsed={collapsed}
          comingSoon={mod.comingSoon}
          comingSoonLabel={comingSoonLabel}
          onNavigate={onNavigate}
        />
      ))}
    </>
  )
}

function modulesForSection(modules: ModuleState[], section: ModuleSection): ModuleState[] {
  return modules.filter((m) => m.section === section)
}

export function AppSidebarPanel({
  collapsed,
  onToggle,
  companyName,
  companySubtitle,
  hideCollapseToggle = false,
  onNavigate,
  className,
}: AppSidebarPanelProps) {
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const toggleAria = collapsed ? t('ariaExpandSidebar') : t('ariaCollapseSidebar')
  const enabledModules = useEnabledModules()
  const analyticsModules = modulesForSection(enabledModules, 'analytics')
  const configModules = modulesForSection(enabledModules, 'config')

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col rounded-md border border-[var(--shell-structure-border)] bg-white shadow-none',
        collapsed ? 'p-2.5 pt-3' : 'px-2.5 pb-2.5 pt-0',
        className,
      )}
    >
      <div
        className={cn(
          'flex w-full shrink-0 border-b border-[var(--shell-structure-border)]',
          collapsed
            ? 'flex-col items-center gap-2 pb-2.5'
            : 'h-[var(--shell-chrome-header-height)] min-h-[var(--shell-chrome-header-height)] items-center gap-2',
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
              {companySubtitle ? (
                <p className="text-xs text-text-tertiary">{companySubtitle}</p>
              ) : null}
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <TenantMark name={companyName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-text-primary">
                {companyName}
              </p>
              {companySubtitle ? (
                <p className="mt-0.5 truncate text-xs leading-tight text-text-tertiary">
                  {companySubtitle}
                </p>
              ) : null}
            </div>
          </>
        )}
        {!hideCollapseToggle && onToggle ? (
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
        ) : null}
      </div>

      <nav
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto',
          collapsed ? 'mt-2 w-full items-center gap-1' : 'mt-2 gap-1 p-0.5 pt-1',
        )}
        aria-label={t('navMain')}
      >
        <NavItem
          Icon={LayoutDashboard}
          to="/dashboard"
          end
          label={t('navHome')}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        {analyticsModules.length > 0 ? (
          <SidebarNavSection collapsed={collapsed} sectionTitle={t('navSectionAnalytics')}>
            <ModuleNavItems
              modules={analyticsModules}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </SidebarNavSection>
        ) : null}
        {configModules.length > 0 ? (
          <SidebarNavSection collapsed={collapsed} sectionTitle={t('navSectionConfiguration')}>
            <ModuleNavItems
              modules={configModules}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </SidebarNavSection>
        ) : null}
      </nav>
    </div>
  )
}
