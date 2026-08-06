import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { ProductPlatformLogoName } from './product-platform-logo-name'

type ProductDetailKpiPlatformBreakdownProps<T extends { platform: string }> = {
  rows: T[]
  formatValue: (row: T) => string
  t: (key: ShellStringKey) => string
}

export function ProductDetailKpiPlatformBreakdown<T extends { platform: string }>({
  rows,
  formatValue,
  t,
}: ProductDetailKpiPlatformBreakdownProps<T>) {
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
