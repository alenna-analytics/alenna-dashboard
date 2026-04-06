import { NavLink, Outlet } from 'react-router-dom'

import { useLanguage } from '@/components/providers/language-provider'
import { useCatalogProducts, useCatalogUnmapped } from '@/hooks/use-analytics'
import { cn } from '@/lib/utils'
import { dashboardT } from '@/lib/dashboard-strings'

function monthStartIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ProductsLayout() {
  const { lang } = useLanguage()
  const t = (key: Parameters<typeof dashboardT>[1]) => dashboardT(lang, key)

  const catalogMeta = useCatalogProducts({ page: 1, page_size: 1 })
  const unmappedMeta = useCatalogUnmapped({
    start_date: monthStartIso(),
    end_date: todayIso(),
    page: 1,
    page_size: 1,
  })

  const catalogTotal = catalogMeta.data?.total ?? 0
  const unmappedTotal = unmappedMeta.data?.total ?? 0

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative inline-flex items-center gap-2 rounded-none px-1 pb-3 text-sm font-medium transition-colors',
      isActive
        ? 'text-text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-primary'
        : 'text-text-secondary hover:text-text-primary',
    )

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {t('productsPageTitle')}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-text-secondary">{t('catalogPageDesc')}</p>
        </div>
      </div>

      <nav className="flex flex-wrap gap-8 border-b border-border-subtle/80">
        <NavLink to="/dashboard/products" end className={tabClass}>
          <span>{t('catalogTabList')}</span>
          <span className="tabular-nums text-xs font-normal text-text-tertiary">({catalogTotal.toLocaleString()})</span>
        </NavLink>
        <NavLink to="/dashboard/products/unmapped" className={tabClass}>
          <span>{t('catalogTabUnmapped')}</span>
          <span className="tabular-nums text-xs font-normal text-text-tertiary">({unmappedTotal.toLocaleString()})</span>
        </NavLink>
      </nav>

      <Outlet />
    </div>
  )
}
