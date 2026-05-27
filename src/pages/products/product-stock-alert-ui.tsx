import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { StockAlertLevel } from '@/lib/types/catalog'
import { Badge } from '@/ui/badge'
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
    <Badge variant={level === 'out' ? 'error' : 'warning'} className={className}>
      {stockAlertShortLabel(t, level)}
    </Badge>
  )
}

export function ProductStockQuantityCell({
  quantity,
  className,
}: {
  quantity: number | null | undefined
  className?: string
}) {
  return (
    <div className={cn('flex w-full justify-end', className)}>
      <span className="text-sm tabular-nums">{quantity != null ? quantity : '—'}</span>
    </div>
  )
}
