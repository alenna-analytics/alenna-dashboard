import { PanelLeft } from 'lucide-react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'

import alennaIconWhite from '@/assets/alenna/alenna-icon-white.svg'
import type { AppIconName } from '@/lib/icons/catalog'
import { useEnabledModules } from '@/lib/modules/use-modules'
import type { ModuleSection, ModuleState } from '@/lib/modules/types'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { SidebarNavSection } from '@/shell/layout/sidebar-nav-section'
import {
  sidebarNavIconClassName,
  sidebarNavLabelClassName,
  sidebarInsetPaddingClassName,
  sidebarNavItemClassName,
  sidebarShellPaddingClassName,
} from '@/shell/layout/sidebar-layout'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/ui/app-icon'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

const DEFAULT_TENANT_MARK_SRC = alennaIconWhite

export type AppSidebarPanelProps = {
  collapsed: boolean
  companyName: string
  companyLogoUrl?: string | null
  companySubtitle: string
  onToggle?: () => void
  hideCollapseToggle?: boolean
  onNavigate?: () => void
  className?: string
}

function linkClassNames(isActive: boolean, collapsed: boolean): string {
  const baseTrans =
    'font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
  const active = cn(
    'bg-[var(--sidebar-active-bg)] font-medium text-text-primary shadow-none',
  )
  const inactive = cn(
    'text-text-secondary hover:bg-[var(--sidebar-accent)] hover:text-text-primary',
  )
  if (collapsed) {
    return cn(
      baseTrans,
      sidebarNavItemClassName,
      'w-8 justify-center px-0',
      isActive ? active : inactive,
    )
  }
  return cn(
    baseTrans,
    sidebarNavItemClassName,
    'w-full gap-2',
    isActive ? active : inactive,
  )
}

function NavItem({
  to,
  end,
  label,
  collapsed,
  icon,
  comingSoon,
  comingSoonLabel,
  onNavigate,
}: {
  to: string
  end?: boolean
  label: string
  collapsed: boolean
  icon: AppIconName
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
      <AppIcon name={icon} colorize className={sidebarNavIconClassName} />
      {!collapsed ? (
        <>
          <span className={sidebarNavLabelClassName}>{label}</span>
          {comingSoon && comingSoonLabel ? (
            <Badge
              variant="info"
              className="ml-auto !h-4 !min-h-0 !max-h-4 shrink-0 rounded-md px-1.5 py-0 text-[10px] font-medium leading-none"
            >
              {comingSoonLabel}
            </Badge>
          ) : null}
        </>
      ) : null}
    </NavLink>
  )

  const tooltipLabel =
    comingSoon && comingSoonLabel ? `${label} · ${comingSoonLabel}` : label

  if (!collapsed) {
    return link
  }

  return (
    <div className="flex w-full min-w-0 shrink-0 justify-center">
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="max-w-[12rem]">
          {tooltipLabel}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function TenantMark({
  logoUrl,
  className,
}: {
  logoUrl?: string | null
  className?: string
}) {
  const trimmedLogo = logoUrl?.trim() ?? ''
  const src = trimmedLogo.length > 0 ? trimmedLogo : DEFAULT_TENANT_MARK_SRC

  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-text-primary p-1',
        className,
      )}
      aria-hidden
    >
      <img src={src} alt="" className="size-5 object-contain" draggable={false} />
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
          icon={mod.icon}
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
  companyLogoUrl,
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
        sidebarShellPaddingClassName,
        className,
      )}
    >
      <div
        className={cn(
          'flex w-full shrink-0 items-center border-b border-[var(--shell-structure-border)]',
          'h-[var(--shell-chrome-header-height)] min-h-[var(--shell-chrome-header-height)]',
          collapsed ? 'justify-center' : 'gap-2',
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TenantMark logoUrl={companyLogoUrl} className="size-9" />
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
            <TenantMark logoUrl={companyLogoUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold leading-tight text-text-primary">
                {companyName}
              </p>
              {companySubtitle ? (
                <p className="mt-0.5 truncate text-sm leading-tight text-text-tertiary">
                  {companySubtitle}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>

      <nav
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pt-2',
          collapsed && 'items-center',
        )}
        aria-label={t('navMain')}
      >
        <NavItem
          icon="home"
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

      {!hideCollapseToggle && onToggle ? (
        <div className={cn('mt-auto shrink-0 border-t border-[var(--shell-structure-border)]', sidebarInsetPaddingClassName)}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label={toggleAria}
            className="size-8 shrink-0 text-text-secondary hover:bg-[var(--sidebar-accent)] hover:text-text-primary"
          >
            <PanelLeft className="size-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
