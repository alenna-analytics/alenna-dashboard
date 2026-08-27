import { NavLink, useLocation } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import {
  TEAM_INNER_NAV,
  isTeamNavItemActive,
} from '@/pages/team/team-inner-nav'
import {
  internalSidebarAsideClassName,
  internalSidebarHeaderRowClassName,
  internalSidebarHeaderTitleClassName,
  internalSidebarNavItemClassName,
  internalSidebarNavLabelClassName,
} from '@/shell/layout/sidebar-layout'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'

function internalNavLinkClass(isActive: boolean): string {
  return cn(
    internalSidebarNavItemClassName,
    'font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
    isActive
      ? 'bg-[var(--sidebar-active-bg)] text-text-primary'
      : 'text-text-tertiary hover:bg-[var(--sidebar-accent)] hover:text-text-primary',
  )
}

export function TeamInternalSidebar() {
  const { pathname } = useLocation()
  const { lang } = useLanguage()
  const t = (key: Parameters<typeof shellT>[1]) => shellT(lang, key)

  return (
    <aside className={internalSidebarAsideClassName} aria-label={t('navTeam')}>
      <div className={internalSidebarHeaderRowClassName}>
        <p className={internalSidebarHeaderTitleClassName}>{t('navTeam')}</p>
      </div>

      <nav className="flex flex-col gap-0.5 bg-white p-3">
        {TEAM_INNER_NAV.map((item) => {
          const isActive = isTeamNavItemActive(item, pathname)
          return (
            <NavLink key={item.id} to={item.path} end={item.id === 'members'} className={internalNavLinkClass(isActive)}>
              <span className={internalSidebarNavLabelClassName}>{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
