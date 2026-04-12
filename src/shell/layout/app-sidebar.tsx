import { BarChart2, LayoutDashboard, Link2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { shellT } from '@/lib/i18n/shell-strings'

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-bg-muted text-text-primary'
      : 'text-text-secondary hover:bg-bg-muted/50 hover:text-text-primary',
  )

export function AppSidebar() {
  const { lang } = useLanguage()

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border-subtle/80 bg-bg-surface">
      <div className="flex h-12 shrink-0 items-center border-b border-border-subtle/80 px-4 text-sm font-semibold text-text-primary">
        {shellT(lang, 'bootBrandName')}
      </div>
      <nav className="flex flex-col gap-1 p-3" aria-label={shellT(lang, 'navMain')}>
        <NavLink to="/dashboard" end className={NAV_LINK_CLASS}>
          <LayoutDashboard className="size-4 shrink-0 opacity-80" aria-hidden />
          {shellT(lang, 'navDashboard')}
        </NavLink>
        <NavLink to="/dashboard/reports" className={NAV_LINK_CLASS}>
          <BarChart2 className="size-4 shrink-0 opacity-80" aria-hidden />
          {shellT(lang, 'navReports')}
        </NavLink>
        <NavLink to="/dashboard/integrations" className={NAV_LINK_CLASS}>
          <Link2 className="size-4 shrink-0 opacity-80" aria-hidden />
          {shellT(lang, 'navIntegrations')}
        </NavLink>
      </nav>
    </aside>
  )
}
