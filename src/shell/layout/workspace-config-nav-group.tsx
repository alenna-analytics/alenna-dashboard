import { matchPath, NavLink, useLocation } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import {
  sidebarNavIconClassName,
  sidebarNavItemClassName,
  sidebarNavItemCollapsedClassName,
  sidebarNavLabelClassName,
} from '@/shell/layout/sidebar-layout'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/ui/app-icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

const CONFIGURATION_PATH = '/dashboard/configuration'

type WorkspaceConfigNavItemProps = {
  collapsed: boolean
  onNavigate?: () => void
}

export function WorkspaceConfigNavItem({ collapsed, onNavigate }: WorkspaceConfigNavItemProps) {
  const { lang } = useLanguage()
  const { pathname } = useLocation()
  const label = shellT(lang, 'navWorkspaceConfiguration')
  const isActive = matchPath({ path: `${CONFIGURATION_PATH}/*` }, pathname) != null

  const link = (
    <NavLink
      to={CONFIGURATION_PATH}
      className={cn(
        'font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        sidebarNavItemClassName,
        collapsed ? sidebarNavItemCollapsedClassName : 'w-full gap-2',
        isActive
          ? 'bg-[var(--sidebar-active-bg)] font-medium text-text-primary shadow-none'
          : 'text-text-secondary hover:bg-[var(--sidebar-accent)] hover:text-text-primary',
      )}
      onClick={() => onNavigate?.()}
    >
      <AppIcon name="config" colorize className={sidebarNavIconClassName} />
      {!collapsed ? <span className={sidebarNavLabelClassName}>{label}</span> : null}
    </NavLink>
  )

  if (!collapsed) {
    return link
  }

  return (
    <div className="flex w-full min-w-0 shrink-0 justify-center">
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="max-w-[12rem]">
          {label}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
