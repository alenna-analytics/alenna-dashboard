import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductSettlementApi } from '@/lib/types/catalog'
import type { SettlementBreakdown } from '@/lib/types/reports'
import { settlementWaterfallLines } from '@/lib/settlement-utils'
import { cn } from '@/lib/utils'

import { settlementLineDisplayValue, settlementLineLabel } from './settlement-line-label'

type SettlementMiniWaterfallProps = {
  settlement: SettlementBreakdown | ProductSettlementApi
  fmtBase: (value: number) => string
  t: (key: ShellStringKey) => string
  compact?: boolean
}

export function SettlementMiniWaterfall({
  settlement,
  fmtBase,
  t,
  compact = false,
}: SettlementMiniWaterfallProps) {
  const lines = settlementWaterfallLines(settlement)

  return (
    <ul className={cn('space-y-1', compact ? 'text-[11px]' : 'text-xs')}>
      {lines.map((line) => {
        const display = settlementLineDisplayValue(line)
        return (
          <li
            key={line.key}
            className={cn(
              'flex items-center justify-between gap-3',
              line.kind === 'total' && 'border-t border-border-subtle/60 pt-1 font-semibold text-text-primary',
              line.kind === 'subtotal' && 'font-medium text-text-primary',
              line.isDeduction && 'text-text-secondary',
            )}
          >
            <span>{settlementLineLabel(line, t)}</span>
            <span className="shrink-0 tabular-nums">{fmtBase(display)}</span>
          </li>
        )
      })}
    </ul>
  )
}
