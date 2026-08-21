import { matchPath, NavLink, useLocation } from 'react-router-dom'

import type { AppIconName } from '@/lib/icons/catalog'
import type { SidebarControlMode } from '@/lib/shell/sidebar-control-prefs'
import { useEnabledModules } from '@/lib/modules/use-modules'
import { can } from '@/lib/permissions/can'
import { useConfigSectionModules, useWorkspaceConfigModuleEnabled, useWorkspaceConfigNavEnabled, useAlarmsModuleEnabled } from '@/lib/modules/use-workspace-config'
import type { ModuleSection, ModuleState } from '@/lib/modules/types'
import { shellT } from '@/lib/i18n/shell-strings'
import { isBillingOwner } from '@/lib/plan/plan-limit-ui'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { SidebarNavSection } from '@/shell/layout/sidebar-nav-section'
import { SidebarControlMenu } from '@/shell/layout/sidebar-control-menu'
import { WorkspaceConfigNavItem } from '@/shell/layout/workspace-config-nav-group'
import {
  sidebarNavIconClassName,
  sidebarNavItemCollapsedClassName,
  sidebarNavLabelClassName,
  sidebarInsetPaddingClassName,
  sidebarNavItemClassName,
  sidebarShellPaddingClassName,
  sidebarShellPaddingCollapsedClassName,
} from '@/shell/layout/sidebar-layout'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/ui/app-icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

export type AppSidebarPanelProps = {
  collapsed: boolean
  controlMode: SidebarControlMode
  onControlModeChange: (mode: SidebarControlMode) => void
  hideCollapseToggle?: boolean
  onNavigate?: () => void
  className?: string
}

function linkClassNames(isActive: boolean, collapsed: boolean): string {
  const baseTrans =
    'font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
  const active = cn(
    'bg-[var(--sidebar-active-bg)] font-semibold text-text-primary shadow-none',
  )
  const inactive = cn(
    'text-text-tertiary hover:bg-[var(--sidebar-accent)] hover:text-text-primary',
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
  const isExact = Boolean(end)
  const isActive =
    matchPath({ path: to, end: isExact }, pathname) != null ||
    (!isExact && pathname.startsWith(`${to}/`))
  const link = (
    <NavLink
      to={to}
      end={end}
      className={linkClassNames(isActive, collapsed)}
      onClick={() => onNavigate?.()}
    >
      <AppIcon name={icon} colorize className={sidebarNavIconClassName} />
      {!collapsed ? (
        <span className={sidebarNavLabelClassName}>{label}</span>
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
  controlMode,
  onControlModeChange,
  hideCollapseToggle = false,
  onNavigate,
  className,
}: AppSidebarPanelProps) {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const enabledModules = useEnabledModules()
  const analyticsModules = modulesForSection(enabledModules, 'analytics')
  const configModules = useConfigSectionModules()
  const integrationsModule = configModules.find((mod) => mod.id === 'integrations')
  const otherConfigModules = configModules.filter((mod) => mod.id !== 'integrations')
  const workspaceConfigEnabled = useWorkspaceConfigModuleEnabled()
  const workspaceConfigNavEnabled = useWorkspaceConfigNavEnabled()
  const alarmsEnabled = useAlarmsModuleEnabled()
  const canSeeBilling = workspaceConfigEnabled && isBillingOwner(me)
  const canSeeTeam = can(me, 'team.view')
  const showWorkspaceSection =
    canSeeTeam ||
    alarmsEnabled ||
    integrationsModule != null ||
    canSeeBilling ||
    otherConfigModules.length > 0


  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-x-hidden bg-white shadow-none',
        collapsed ? sidebarShellPaddingCollapsedClassName : sidebarShellPaddingClassName,
        className,
      )}
    >
      <nav
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto',
          collapsed ? 'items-center pt-2' : 'pt-2',
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
        <ModuleNavItems
          modules={analyticsModules}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        {showWorkspaceSection ? (
          <SidebarNavSection collapsed={collapsed} sectionLabel={t('navSectionWorkspace')}>
            {canSeeTeam ? (
            <NavItem
              icon="orgs"
              to="/dashboard/team"
              label={t('navTeam')}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
            ) : null}
            {integrationsModule ? (
              <NavItem
                icon={integrationsModule.icon}
                to={integrationsModule.path}
                label={t(integrationsModule.labelKey)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ) : null}
            {alarmsEnabled ? (
              <NavItem
                icon="notifications"
                to="/dashboard/alarms"
                label={t('navAlarms')}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ) : null}
            {canSeeBilling ? (
              <NavItem
                icon="billing"
                to="/dashboard/billing"
                label={t('navBilling')}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ) : null}
            <ModuleNavItems
              modules={otherConfigModules}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </SidebarNavSection>
        ) : null}
        {workspaceConfigNavEnabled ? (
          <SidebarNavSection collapsed={collapsed} sectionLabel={t('navSectionConfiguration')}>
            <WorkspaceConfigNavItem collapsed={collapsed} onNavigate={onNavigate} />
          </SidebarNavSection>
        ) : null}
      </nav>

      {!hideCollapseToggle ? (
        <div
          className={cn(
            'mt-auto flex w-full shrink-0 overflow-x-hidden',
            collapsed ? 'justify-center pb-2 pt-2' : cn(sidebarInsetPaddingClassName, 'justify-start'),
          )}
        >
          <SidebarControlMenu
            mode={controlMode}
            onModeChange={onControlModeChange}
            collapsed={collapsed}
          />
        </div>
      ) : null}
    </div>
  )
}
