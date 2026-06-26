import type { ComponentProps, ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'
import {
  surfaceKpiClassName,
  surfaceKpiCompactClassName,
} from '@/ui/surface'
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
      className={cn('font-numeric tabular-nums', !empty && 'font-medium')}
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
  /** Renders placeholder text instead of value; hides comparison row. */
  placeholder?: boolean
  placeholderLabel?: string
  /** Smaller typography for secondary KPI rows. */
  compact?: boolean
  /** Skip surface class (border/bg/padding) — parent cell provides styling. */
  bare?: boolean
  footer?: ReactNode
  footerClassName?: string
  valueClassName?: string
  className?: string
}

export function KpiCard({
  label,
  helpText,
  value,
  vsPriorLabel,
  priorValueDisplay,
  pct,
  trend,
  comparisonUnavailable,
  negativeMetric,
  showComparison = true,
  placeholder = false,
  placeholderLabel = '—',
  compact = false,
  bare = false,
  footer,
  footerClassName,
  valueClassName,
  className,
}: KpiCardProps) {
  const unavailable = comparisonUnavailable
  const showDelta = showComparison && !placeholder

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col text-left',
        bare
          ? 'gap-2'
          : compact
            ? cn(surfaceKpiCompactClassName, 'gap-1.5')
            : cn(surfaceKpiClassName, 'gap-2'),
        placeholder && 'opacity-80',
        className,
      )}
    >
      <div className="flex w-full min-w-0 items-start justify-between gap-2">
        <span
          className={cn(
            'min-w-0 font-medium leading-tight tracking-tight text-text-secondary',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {label}
        </span>
        {helpText ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-text-secondary"
                aria-label={helpText}
              >
                <HelpCircle className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-left text-xs font-normal leading-snug">
              {helpText}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <p
        className={cn(
          'font-numeric min-w-0 font-medium leading-none tracking-tight text-xl',
          placeholder
            ? 'text-text-secondary'
            : 'text-(--color-accent-forest)',
          valueClassName,
        )}
      >
        {placeholder ? placeholderLabel : value}
      </p>

      {showDelta ? (
        <div
          className="flex min-w-0 flex-wrap items-center gap-1.5"
          aria-label={`${vsPriorLabel}: ${priorValueDisplay ?? '—'}`}
        >
          <span className="font-numeric min-w-0 text-xs tabular-nums text-text-secondary">
            {priorValueDisplay ?? '—'}
          </span>
          <KpiDeltaPill
            pct={pct}
            trend={trend}
            comparisonUnavailable={unavailable}
            negativeMetric={negativeMetric}
          />
        </div>
      ) : null}

      {footer ? (
        <div
          className={cn(
            'mt-1 space-y-0.5 text-xs leading-snug tabular-nums text-(--color-text-muted)',
            footerClassName,
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
