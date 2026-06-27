import { Info } from 'lucide-react'
import { useMemo } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { effectiveStockAlertLevel } from '@/pages/configuration/alarms/stock/use-stock-alert-display'
import { useStockRuleQuery } from '@/pages/configuration/alarms/stock/use-alert-rules-queries'
import { cn } from '@/lib/utils'

import { productPlatformLabel } from './product-platform-label'

const MAX_ALERT_CHANNELS = 3

type ProductDetailStockAlertProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
}

function uniqueAlertPlatformLabels(
  alerts: ProductDetailApi['stock_alert_summary'],
  t: (key: ShellStringKey) => string,
): string[] {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const alert of alerts) {
    const slug = alert.platform.trim().toLowerCase()
    if (seen.has(slug)) continue
    seen.add(slug)
    labels.push(productPlatformLabel(alert.platform, t))
  }
  return labels
}

export function ProductDetailStockAlert({ detail, t }: ProductDetailStockAlertProps) {
  const { data: rule } = useStockRuleQuery()

  const alerts = useMemo(() => {
    return detail.stock_alert_summary.filter((alert) => {
      const level = effectiveStockAlertLevel(alert.stock_alert, rule)
      return level === 'low' || level === 'out'
    })
  }, [detail.stock_alert_summary, rule])

  if (alerts.length === 0) return null

  const alertPlatformLabels = uniqueAlertPlatformLabels(alerts, t)
  const shown = alertPlatformLabels.slice(0, MAX_ALERT_CHANNELS)
  const moreAlerts = alertPlatformLabels.length - shown.length
  const platformsText =
    moreAlerts > 0
      ? `${shown.join(', ')} ${t('productsDetailStockAlertMore').replace('{count}', String(moreAlerts))}`
      : shown.join(', ')

  const isOut = alerts.some((a) => effectiveStockAlertLevel(a.stock_alert, rule) === 'out')
  const message = (
    isOut ? t('productsDetailStockAlertBannerOut') : t('productsDetailStockAlertBannerLow')
  ).replace('{platforms}', platformsText)

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-4 text-sm',
        'border-[color-mix(in_srgb,var(--status-amber-600)_22%,transparent)]',
        'bg-[var(--status-amber-50)] text-[var(--status-amber-900)]',
      )}
      role="status"
    >
      <Info className="size-4 shrink-0 opacity-80" aria-hidden />
      <span className="min-w-0 leading-snug">{message}</span>
    </div>
  )
}
