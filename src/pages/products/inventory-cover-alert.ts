import type { ShellStringKey } from '@/lib/i18n/shell-strings'

import { productPlatformLabel } from './product-platform-label'
import type { ChannelCoverRow } from './vinculacion/group-channel-cover'
import { formatShortDayMonth } from './vinculacion/group-weekly-sales'

type ShellT = (key: ShellStringKey) => string

export type InventoryCoverAlertCopy = {
  title: string
  subtitle: string
  tone: 'critical' | 'warning'
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value == null ? match : String(value)
  })
}

function locale(lang: string): string {
  return lang === 'en' ? 'en-US' : 'es-MX'
}

function oneDecimal(value: number, lang: string): string {
  return value.toLocaleString(locale(lang), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

/** Critical and attention cover rows, with units, days, and the stockout date. */
export function inventoryCoverAlertCopy(
  row: ChannelCoverRow,
  lang: string,
  t: ShellT,
): InventoryCoverAlertCopy | null {
  if (row.isTotal || (row.alert !== 'critical' && row.alert !== 'attention')) return null
  const platform = productPlatformLabel(row.platform, t)
  const title = fill(
    t(
      row.alert === 'critical'
        ? 'productsInventoryAlertCriticalOn'
        : 'productsInventoryAlertAttentionOn',
    ),
    { platform },
  )
  const stock = row.stockKnown ? row.stock.toLocaleString(locale(lang)) : null
  const days = row.inventoryDays != null ? oneDecimal(row.inventoryDays, lang) : null
  const date = row.stockoutOn ? formatShortDayMonth(row.stockoutOn, lang) : null
  const subtitle =
    stock != null && days != null && date != null
      ? fill(t('productsInventoryAlertDetail'), { stock, days, date })
      : stock != null
        ? fill(t('productsInventoryAlertStockOnly'), { stock })
        : platform
  return {
    title,
    subtitle,
    tone: row.alert === 'critical' ? 'critical' : 'warning',
  }
}
