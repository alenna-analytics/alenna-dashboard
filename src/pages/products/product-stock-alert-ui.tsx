/* eslint-disable react-refresh/only-export-components -- badge helpers + cell component */
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { StockAlertLevel } from '@/lib/types/catalog'
import { StatusPill } from '@/ui/status-pill'
import { cn } from '@/lib/utils'

import { stockAlertShortLabel } from './product-stock-alert-label'

export function ProductStockAlertBadge({
  level,
  t,
  className,
}: {
  level: StockAlertLevel
  t: (key: ShellStringKey) => string
  className?: string
}) {
  if (level === 'none') {
    return <span className={cn('text-sm text-text-tertiary', className)}>—</span>
  }
  return (
    <StatusPill
      variant={level === 'out' ? 'error' : 'warning'}
      className={className}
    >
      {stockAlertShortLabel(t, level)}
    </StatusPill>
  )
}

export function displayStockQuantity(quantity: number | null | undefined): number | null {
  if (quantity == null) return null
  return Math.max(0, Math.trunc(quantity))
}

export function ProductStockQuantityCell({
  quantity,
  className,
}: {
  quantity: number | null | undefined
  className?: string
}) {
  const display = displayStockQuantity(quantity)
  return (
    <div className={cn('flex w-full justify-end', className)}>
      <span className="text-sm tabular-nums">{display != null ? display : '—'}</span>
    </div>
  )
}
