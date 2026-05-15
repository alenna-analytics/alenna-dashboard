import type { ComponentProps, ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

type PctTrend = 'up' | 'down' | 'flat'

type KpiCardVariant = 'default' | 'featured'

type DeltaPillProps = {
  pct: number | null
  trend: PctTrend
  comparisonUnavailable: boolean
  negativeMetric?: boolean
}

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>['variant']>

function deltaBadgeVariant(
  pct: number | null,
  trend: PctTrend,
  comparisonUnavailable: boolean,
  negativeMetric: boolean | undefined,
): BadgeVariant {
  if (comparisonUnavailable || pct === null) return 'secondary'
  const invert = Boolean(negativeMetric)
  const good = invert ? trend === 'down' : trend === 'up'
  const bad = invert ? trend === 'up' : trend === 'down'
  if (good) return 'success'
  if (bad) return 'error'
  return 'secondary'
}

export function KpiDeltaPill({
  pct,
  trend,
  comparisonUnavailable,
  negativeMetric,
}: DeltaPillProps) {
  const empty = comparisonUnavailable || pct === null
  const variant = deltaBadgeVariant(pct, trend, comparisonUnavailable, negativeMetric)
  let pctStr = '—'
  if (!empty && pct !== null) {
    pctStr = `${trend === 'up' && pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
  }

  return (
    <Badge
      variant={variant}
      className={cn('tabular-nums', !empty && 'font-semibold')}
    >
      {pctStr}
    </Badge>
  )
}

export type KpiCardProps = {
  label: string
  helpText?: string
  variant?: KpiCardVariant
  value: string
  vsPriorLabel: string
  priorValueDisplay: string | null
  pct: number | null
  trend: PctTrend
  comparisonUnavailable: boolean
  negativeMetric?: boolean
  /** When false, hides prior row (MoM/YoY-only cards). */
  showComparison?: boolean
  footer?: ReactNode
  className?: string
}

export function KpiCard({
  label,
  helpText,
  variant = 'default',
  value,
  vsPriorLabel,
  priorValueDisplay,
  pct,
  trend,
  comparisonUnavailable,
  negativeMetric,
  showComparison = true,
  footer,
  className,
}: KpiCardProps) {
  const featured = variant === 'featured'
  const unavailable = comparisonUnavailable

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-2.5 rounded-md p-3.5 text-left sm:p-4',
        featured
          ? 'border border-[var(--color-border)] bg-[var(--color-bg-section)] shadow-[var(--shadow-ink-sm)]'
          : 'border border-[var(--shell-structure-border)] bg-white shadow-none',
        className,
      )}
    >
      <div className="flex w-full min-w-0 items-start justify-between gap-2">
        <span className="min-w-0 text-base font-medium leading-tight tracking-tight text-[var(--color-text-primary)]">
          {label}
        </span>
        {helpText ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded-full p-0.5 text-[var(--color-text-muted)] hover:text-text-secondary"
                aria-label={helpText}
              >
                <HelpCircle className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-left text-xs font-normal leading-snug">
              {helpText}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <p className="font-numeric min-w-0 text-2xl font-semibold leading-none tracking-tight text-[var(--color-accent-forest)] sm:text-[1.75rem]">
        {value}
      </p>

      {showComparison ? (
        <div className="mt-1 space-y-2">
          <p className="text-xs leading-tight text-[var(--color-text-muted)]">{vsPriorLabel}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-numeric min-w-0 text-lg font-semibold tabular-nums text-[var(--color-text-primary)]">
              {priorValueDisplay ?? '—'}
            </span>
            <KpiDeltaPill
              pct={pct}
              trend={trend}
              comparisonUnavailable={unavailable}
              negativeMetric={negativeMetric}
            />
          </div>
        </div>
      ) : null}

      {footer ? (
        <div className="mt-1 space-y-0.5 text-xs leading-snug tabular-nums text-[var(--color-text-muted)]">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
