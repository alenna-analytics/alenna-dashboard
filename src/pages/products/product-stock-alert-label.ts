import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { StockAlertLevel } from '@/lib/types/catalog'

export function stockAlertShortLabel(
  t: (key: ShellStringKey) => string,
  level: StockAlertLevel,
): string {
  if (level === 'out') return t('productsDetailStockAlertOutShort')
  if (level === 'low') return t('productsDetailStockAlertLowShort')
  return '—'
}
