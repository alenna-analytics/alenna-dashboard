import { BarChart2, LayoutDashboard, Link2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { shellT } from '@/lib/i18n/shell-strings'

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors [&_svg]:shrink-0',
    isActive
      ? 'bg-primary text-primary-foreground shadow-[var(--glass-shadow)] backdrop-blur-xl [&_svg]:opacity-100'
      : 'text-text-secondary [&_svg]:opacity-80 hover:bg-glass-fill-muted hover:text-text-primary',
  )

export function AppSidebar() {
  const { lang } = useLanguage()

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-transparent">
      <div className="flex h-14 shrink-0 items-center px-4 pt-2 text-sm font-semibold tracking-tight text-text-primary">
        {shellT(lang, 'bootBrandName')}
      </div>
      <nav className="flex flex-col gap-1.5 p-3 pt-1" aria-label={shellT(lang, 'navMain')}>
        <NavLink to="/dashboard" end className={NAV_LINK_CLASS}>
          <LayoutDashboard className="size-4" aria-hidden />
          {shellT(lang, 'navDashboard')}
        </NavLink>
        <NavLink to="/dashboard/reports" className={NAV_LINK_CLASS}>
          <BarChart2 className="size-4" aria-hidden />
          {shellT(lang, 'navReports')}
        </NavLink>
        <NavLink to="/dashboard/integrations" className={NAV_LINK_CLASS}>
          <Link2 className="size-4" aria-hidden />
          {shellT(lang, 'navIntegrations')}
        </NavLink>
      </nav>
    </aside>
  )
}
