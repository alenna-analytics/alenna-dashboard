import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductPlatformPeriodApi } from '@/lib/types/catalog'
import { ProductPlatformLogoName } from './product-platform-logo-name'

type ProductDetailKpiPlatformBreakdownProps = {
  rows: ProductPlatformPeriodApi[]
  formatValue: (row: ProductPlatformPeriodApi) => string
  t: (key: ShellStringKey) => string
}

export function ProductDetailKpiPlatformBreakdown({
  rows,
  formatValue,
  t,
}: ProductDetailKpiPlatformBreakdownProps) {
  if (rows.length === 0) {
    return null
  }

  return (
    <ul className="mt-2 space-y-1 border-t border-border-subtle/60 pt-2">
      {rows.map((row) => (
        <li
          key={row.platform}
          className="flex items-center justify-between gap-2 text-xs text-text-secondary"
        >
          <ProductPlatformLogoName
            platformSlug={row.platform}
            t={t}
            logoClassName="size-4"
            textClassName="text-xs text-text-secondary"
          />
          <span className="shrink-0 font-numeric tabular-nums text-text-primary">
            {formatValue(row)}
          </span>
        </li>
      ))}
    </ul>
  )
}
