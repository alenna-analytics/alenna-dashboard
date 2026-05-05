import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

type PctTrend = 'up' | 'down' | 'flat'

type KpiCardVariant = 'default' | 'featured'

type DeltaPillProps = {
  pct: number | null
  trend: PctTrend
  comparisonUnavailable: boolean
  negativeMetric?: boolean
  /** featured card needs light-friendly pill contrast */
  onDark?: boolean
}

export function KpiDeltaPill({
  pct,
  trend,
  comparisonUnavailable,
  negativeMetric,
  onDark,
}: DeltaPillProps) {
  if (comparisonUnavailable) {
    return (
      <span
        className={cn(
          'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium tabular-nums',
          onDark ? 'bg-white/15 text-white/80' : 'bg-[var(--kpi-pill-neutral-bg)] text-[var(--color-text-muted)]',
        )}
      >
        —
      </span>
    )
  }

  if (pct === null) {
    return (
      <span
        className={cn(
          'shrink-0 rounded-md px-2.5 py-1 text-xs tabular-nums',
          onDark ? 'bg-white/15 text-white/80' : 'text-[var(--color-text-muted)]',
        )}
      >
        —
      </span>
    )
  }

  const invert = Boolean(negativeMetric)
  const good = invert ? trend === 'down' : trend === 'up'
  const bad = invert ? trend === 'up' : trend === 'down'
  const pctStr = `${trend === 'up' && pct > 0 ? '+' : ''}${pct.toFixed(1)}%`

  return (
    <span
      className={cn(
        'shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold tabular-nums',
        good && 'bg-[var(--kpi-pill-positive-bg)] text-[var(--kpi-pill-positive-text)]',
        bad && 'bg-[var(--kpi-pill-negative-bg)] text-[var(--kpi-pill-negative-text)]',
        !good && !bad && (onDark ? 'bg-white/15 text-white/85' : 'bg-[var(--kpi-pill-neutral-bg)] text-[var(--color-text-muted)]'),
      )}
    >
      {pctStr}
    </span>
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
          ? 'border border-white/25 bg-[var(--color-accent-forest)] text-white shadow-none'
          : 'border border-[var(--shell-structure-border)] bg-white text-[var(--color-text-primary)] shadow-none',
        className,
      )}
    >
      <div className="flex w-full min-w-0 items-start justify-between gap-2">
        <span
          className={cn(
            'min-w-0 text-base font-medium leading-tight tracking-tight',
            featured ? 'text-white/95' : 'text-[var(--color-text-primary)]',
          )}
        >
          {label}
        </span>
        {helpText ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  'shrink-0 rounded-full p-0.5',
                  featured ? 'text-white/70 hover:text-white' : 'text-[var(--color-text-muted)] hover:text-text-secondary',
                )}
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

      <p
        className={cn(
          'font-numeric min-w-0 text-2xl font-semibold leading-none tracking-tight sm:text-[1.75rem]',
          featured ? 'text-white' : 'text-[var(--color-accent-forest)]',
        )}
      >
        {value}
      </p>

      {showComparison ? (
        <div className="mt-1 space-y-2">
          <p
            className={cn(
              'text-xs leading-tight',
              featured ? 'text-white/75' : 'text-[var(--color-text-muted)]',
            )}
          >
            {vsPriorLabel}
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={cn(
                'font-numeric min-w-0 text-lg font-semibold tabular-nums',
                featured ? 'text-white' : 'text-[var(--color-text-primary)]',
              )}
            >
              {priorValueDisplay ?? '—'}
            </span>
            <KpiDeltaPill
              pct={pct}
              trend={trend}
              comparisonUnavailable={unavailable}
              negativeMetric={negativeMetric}
              onDark={featured}
            />
          </div>
        </div>
      ) : null}

      {footer ? (
        <div
          className={cn(
            'mt-1 space-y-0.5 text-xs leading-snug tabular-nums',
            featured ? 'text-white/80' : 'text-[var(--color-text-muted)]',
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
