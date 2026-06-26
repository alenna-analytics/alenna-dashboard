import { NavLink, useLocation } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import {
  INTEGRATIONS_INNER_NAV,
  isIntegrationsNavItemActive,
} from '@/pages/integrations/dashboard/integrations-inner-nav'
import {
  sidebarNavItemClassName,
  sidebarNavLabelClassName,
} from '@/shell/layout/sidebar-layout'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'

function internalNavLinkClass(isActive: boolean): string {
  return cn(
    sidebarNavItemClassName,
    'text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
    isActive
      ? 'bg-[var(--sidebar-active-bg)] text-text-primary'
      : 'text-text-secondary hover:bg-[var(--sidebar-accent)] hover:text-text-primary',
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
      <span className={sidebarNavLabelClassName}>{label}</span>
    </NavLink>
  )
}

export function IntegrationsInternalSidebar() {
  const { pathname } = useLocation()
  const { lang } = useLanguage()
  const t = (key: Parameters<typeof shellT>[1]) => shellT(lang, key)

  return (
    <aside
      className="hidden h-full w-full max-w-[var(--shell-inner-sidebar-width)] shrink-0 flex-col overflow-y-auto border-r border-[var(--shell-divider)] bg-white lg:flex"
      aria-label={t('navIntegrations')}
    >
      <div className="flex h-[var(--shell-inner-header-height)] shrink-0 items-center border-b border-[var(--shell-divider)] bg-white px-4">
        <p className="truncate text-subtitle font-semibold text-text-primary">
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
