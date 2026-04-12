import { BarChart2, LayoutDashboard, Link2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { shellT } from '@/lib/i18n/shell-strings'

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-200 [&_svg]:shrink-0',
    isActive
      ? 'bg-primary text-primary-foreground shadow-[0_18px_30px_rgba(var(--brand-rgb),0.18)] [&_svg]:opacity-100'
      : 'text-text-secondary [&_svg]:opacity-75 hover:bg-brand-dim hover:text-text-primary',
  )

export function AppSidebar() {
  const { lang } = useLanguage()

  return (
    <aside className="flex w-60 shrink-0 flex-col">
      <div className="flex h-full min-h-0 flex-col rounded-[2rem] border border-border-default bg-bg-elevated/90 p-4 shadow-[var(--shadow-ink-md)]">
        <div className="flex h-16 shrink-0 items-center gap-3 px-2">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-[0_12px_20px_rgba(var(--brand-rgb),0.16)]">
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-text-primary">
              {shellT(lang, 'bootBrandName')}
            </p>
          </div>
        </div>
        <div className="mb-3 mt-2 h-px bg-border-subtle" aria-hidden />
        <nav className="flex flex-1 flex-col gap-2 p-2 pt-1" aria-label={shellT(lang, 'navMain')}>
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
        <div className="rounded-[1.5rem] border border-border-subtle bg-bg-section px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
            {shellT(lang, 'bootBrandName')}
          </p>
          <p className="mt-1 text-sm font-medium text-text-primary">{shellT(lang, 'navReports')}</p>
        </div>
      </div>
    </aside>
  )
}
