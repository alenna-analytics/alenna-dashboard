import { matchPath, NavLink, useLocation } from 'react-router-dom'

import { CONFIGURABLE_ALARM_TYPES } from '@/pages/configuration/alarms/alarm-types'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'

function internalNavLinkClass(isActive: boolean): string {
  return cn(
    'flex h-8 items-center rounded-md px-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
    isActive
      ? 'bg-[var(--sidebar-active-bg)] text-text-primary'
      : 'text-text-secondary hover:bg-[var(--sidebar-accent)] hover:text-text-primary',
  )
}

function InternalNavItem({ to, end, label }: { to: string; end?: boolean; label: string }) {
  const { pathname } = useLocation()
  const isActive = matchPath({ path: to, end: Boolean(end) }, pathname) != null

  return (
    <NavLink to={to} end={end} className={internalNavLinkClass(isActive)}>
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export function ConfigurationInternalSidebar() {
  const { lang } = useLanguage()
  const t = (key: Parameters<typeof shellT>[1]) => shellT(lang, key)

  return (
    <aside
      className="sticky top-0 hidden w-52 shrink-0 self-start flex-col border-r border-[var(--shell-structure-border)] bg-white lg:flex lg:h-[calc(100svh-var(--shell-chrome-header-height)-1.5rem)] lg:overflow-y-auto"
      aria-label={t('navAlarms')}
    >
      <div className="flex h-[var(--shell-chrome-header-height)] shrink-0 items-center border-b border-[var(--shell-structure-border)] px-4">
        <p className="truncate text-sm font-semibold text-text-primary">{t('navAlarms')}</p>
      </div>

      <nav className="flex flex-col gap-0.5 p-3">
        {CONFIGURABLE_ALARM_TYPES.map((alarmType) => (
            <InternalNavItem
              key={alarmType.id}
              to={alarmType.path}
              end
              label={t(alarmType.titleKey)}
            />
          ))}
      </nav>
    </aside>
  )
}
