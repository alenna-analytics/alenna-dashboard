import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { StockAlertLevel } from '@/lib/types/catalog'

export function stockAlertFilterOptionLabel(
  t: (key: ShellStringKey) => string,
  level: StockAlertLevel,
): string {
  if (level === 'out') return t('productsDetailStockAlertOut')
  if (level === 'low') return t('productsDetailStockAlertLow')
  return t('productsFilterAlertNone')
}
