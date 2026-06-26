import { PanelLeft } from 'lucide-react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'

import type { AppIconName } from '@/lib/icons/catalog'
import { useEnabledModules } from '@/lib/modules/use-modules'
import { useConfigSectionModules, useWorkspaceConfigModuleEnabled } from '@/lib/modules/use-workspace-config'
import type { ModuleSection, ModuleState } from '@/lib/modules/types'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { SidebarNavSection } from '@/shell/layout/sidebar-nav-section'
import { WorkspaceConfigNavItem } from '@/shell/layout/workspace-config-nav-group'
import {
  sidebarNavIconClassName,
  sidebarNavItemCollapsedClassName,
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

export type AppSidebarPanelProps = {
  collapsed: boolean
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
      sidebarNavItemCollapsedClassName,
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
          <span className={cn(sidebarNavLabelClassName, 'text-sm')}>{label}</span>
          {comingSoon && comingSoonLabel ? (
            <Badge
              variant="info"
              className="ml-auto shrink-0 font-numeric"
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
  hideCollapseToggle = false,
  onNavigate,
  className,
}: AppSidebarPanelProps) {
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const toggleAria = collapsed ? t('ariaExpandSidebar') : t('ariaCollapseSidebar')
  const enabledModules = useEnabledModules()
  const analyticsModules = modulesForSection(enabledModules, 'analytics')
  const configModules = useConfigSectionModules()
  const integrationsModule = configModules.find((mod) => mod.id === 'integrations')
  const otherConfigModules = configModules.filter((mod) => mod.id !== 'integrations')
  const workspaceConfigEnabled = useWorkspaceConfigModuleEnabled()
  const showBottomSection =
    integrationsModule != null || workspaceConfigEnabled || otherConfigModules.length > 0

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-white shadow-none',
        sidebarShellPaddingClassName,
        className,
      )}
    >
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
        <NavItem
          icon="home"
          to="/dashboard/home-v2"
          end
          label={t('navHomeV2')}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <ModuleNavItems
          modules={analyticsModules}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        {showBottomSection ? (
          <SidebarNavSection collapsed={collapsed} sectionLabel={t('navSectionConfiguration')}>
            {integrationsModule ? (
              <NavItem
                icon={integrationsModule.icon}
                to={integrationsModule.path}
                end
                label={t(integrationsModule.labelKey)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ) : null}
            {workspaceConfigEnabled ? (
              <WorkspaceConfigNavItem collapsed={collapsed} onNavigate={onNavigate} />
            ) : null}
            <ModuleNavItems
              modules={otherConfigModules}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </SidebarNavSection>
        ) : null}
      </nav>

      {!hideCollapseToggle && onToggle ? (
        <div
          className={cn(
            'mt-auto shrink-0 -mx-2',
            sidebarInsetPaddingClassName,
          )}
        >
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
