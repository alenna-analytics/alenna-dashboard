import { Info } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'

type HomeStockInventoryAlertsProps = {
  lowCount: number
  outCount: number
  t: (key: ShellStringKey) => string
}

function formatCountMessage(template: string, count: number): string {
  return template.replace('{count}', String(count))
}

function AlertBanner({
  message,
  variant,
  viewLabel,
}: {
  message: string
  variant: 'low' | 'out'
  viewLabel: string
}) {
  const isOut = variant === 'out'
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-3 text-sm',
        isOut
          ? 'border-[var(--stock-alert-critical-border)] bg-[var(--stock-alert-critical-bg)] text-[var(--stock-alert-critical)]'
          : 'border-[var(--stock-alert-warning-border)] bg-[var(--stock-alert-warning-bg)] text-[var(--stock-alert-warning)]',
      )}
      role="status"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Info className="size-4 shrink-0 opacity-80" aria-hidden />
        <span className="min-w-0 leading-snug">{message}</span>
      </div>
      <Link
        to="/dashboard/products"
        className={cn(
          'shrink-0 text-sm font-medium underline underline-offset-2',
          isOut
            ? 'text-[var(--stock-alert-critical)]'
            : 'text-[var(--stock-alert-warning)]',
        )}
      >
        {viewLabel}
      </Link>
    </div>
  )
}

export function HomeStockInventoryAlerts({ lowCount, outCount, t }: HomeStockInventoryAlertsProps) {
  if (lowCount <= 0 && outCount <= 0) return null

  const viewLabel = t('homeStockAlertViewProducts')

  return (
    <div className="flex flex-col gap-2">
      {outCount > 0 ? (
        <AlertBanner
          variant="out"
          message={formatCountMessage(t('homeStockAlertOutBanner'), outCount)}
          viewLabel={viewLabel}
        />
      ) : null}
      {lowCount > 0 ? (
        <AlertBanner
          variant="low"
          message={formatCountMessage(t('homeStockAlertLowBanner'), lowCount)}
          viewLabel={viewLabel}
        />
      ) : null}
    </div>
  )
}
