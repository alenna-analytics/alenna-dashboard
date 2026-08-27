import { NavLink, useLocation } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import {
  INTEGRATIONS_INNER_NAV,
  isIntegrationsNavItemActive,
} from '@/pages/integrations/dashboard/integrations-inner-nav'
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

function InternalNavItem({
  to,
  label,
  isActive,
}: {
  to: string
  label: string
  isActive: boolean
}) {
  return (
    <NavLink to={to} end className={internalNavLinkClass(isActive)}>
      <span className={internalSidebarNavLabelClassName}>{label}</span>
    </NavLink>
  )
}

export function IntegrationsInternalSidebar() {
  const { pathname } = useLocation()
  const { lang } = useLanguage()
  const t = (key: Parameters<typeof shellT>[1]) => shellT(lang, key)

  return (
    <aside className={internalSidebarAsideClassName} aria-label={t('navIntegrations')}>
      <div className={internalSidebarHeaderRowClassName}>
        <p className={internalSidebarHeaderTitleClassName}>
          {t('navIntegrations')}
        </p>
      </div>

      <nav className="flex flex-col gap-0.5 bg-white p-3">
        {INTEGRATIONS_INNER_NAV.map((item) => (
          <InternalNavItem
            key={item.id}
            to={item.path}
            label={t(item.labelKey)}
            isActive={isIntegrationsNavItemActive(item, pathname)}
          />
        ))}
      </nav>
    </aside>
  )
}
