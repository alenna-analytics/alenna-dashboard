 
import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

import { cn } from '@/lib/utils'
import { kpiValueToneClass } from '@/lib/kpi-value-tone'
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

const SPARKLINE_STROKE = 'var(--country-green-base)'

export const kpiCardGridClassName =
  'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'

export type KpiSparklinePoint = {
  label: string
  value: number
}

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

function KpiHelpButton({
  helpText,
  stopClick,
}: {
  helpText: string
  stopClick?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-text-secondary"
          aria-label={helpText}
          onClick={stopClick ? (event) => event.stopPropagation() : undefined}
        >
          <HelpCircle className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-left text-xs font-normal leading-snug">
        {helpText}
      </TooltipContent>
    </Tooltip>
  )
}

function SparklineTooltip({
  active,
  payload,
  metricLabel,
  formatValue,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: KpiSparklinePoint }>
  metricLabel: string
  formatValue: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="rounded-md border border-border-default bg-white px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      <p className="mb-1.5 font-medium text-text-primary">{row.label}</p>
      <p className="tabular-nums leading-snug">
        <span className="text-text-tertiary">{metricLabel}:</span>{' '}
        <span className="font-medium text-text-primary">{formatValue(row.value)}</span>
      </p>
    </div>
  )
}

function KpiSparkline({
  points,
  metricLabel,
  formatValue,
}: {
  points: KpiSparklinePoint[]
  metricLabel: string
  formatValue: (value: number) => string
}) {
  if (points.length <= 1) {
    return <div className="h-full w-full rounded-sm bg-muted/20" aria-hidden />
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <RechartsTooltip
          content={<SparklineTooltip metricLabel={metricLabel} formatValue={formatValue} />}
          wrapperStyle={{ outline: 'none' }}
          contentStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            border: 'none',
            borderRadius: 0,
            boxShadow: 'none',
          }}
          cursor={{ stroke: 'var(--border-emphasis)', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={SPARKLINE_STROKE}
          fill="none"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, fill: SPARKLINE_STROKE, stroke: 'white', strokeWidth: 1 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export type KpiCardProps = {
  label: string
  helpText?: string
  variant?: KpiCardVariant
  value: ReactNode
  numericValue?: number | null
  currencyCode?: string
  vsPriorLabel?: string
  priorValueDisplay?: string | null
  pct?: number | null
  trend?: PctTrend
  comparisonUnavailable?: boolean
  negativeMetric?: boolean
  showComparison?: boolean
  deltaBesideValue?: boolean
  deltaTooltip?: string
  placeholder?: boolean
  placeholderLabel?: string
  compact?: boolean
  bare?: boolean
  footer?: ReactNode
  footerClassName?: string
  valueClassName?: string
  className?: string
  dragHandle?: ReactNode
  sparklinePoints?: KpiSparklinePoint[]
  sparklineValues?: number[]
  sparklineMetricLabel?: string
  formatSparklineValue?: (value: number) => string
  selectable?: boolean
  selected?: boolean
  accentColor?: string
  onSelect?: () => void
}

export function KpiCard({
  label,
  helpText,
  value,
  numericValue,
  currencyCode,
  vsPriorLabel = '',
  priorValueDisplay = null,
  pct = null,
  trend = 'flat',
  comparisonUnavailable = false,
  negativeMetric,
  showComparison = true,
  deltaBesideValue = false,
  deltaTooltip,
  placeholder = false,
  placeholderLabel = '—',
  compact = false,
  bare = false,
  footer,
  footerClassName,
  valueClassName,
  className,
  dragHandle,
  sparklinePoints,
  sparklineValues = [],
  sparklineMetricLabel,
  formatSparklineValue,
  selectable = false,
  selected = false,
  accentColor,
  onSelect,
}: KpiCardProps) {
  const unavailable = comparisonUnavailable
  const showDeltaRow = showComparison && !placeholder && !deltaBesideValue
  const showInlineDelta = deltaBesideValue && !placeholder
  const sparkData =
    sparklinePoints ??
    sparklineValues.map((v) => ({
      label: '',
      value: v,
    }))
  const showSparkline = sparklinePoints !== undefined || sparklineValues.length > 0
  const formatSparkValue =
    formatSparklineValue ??
    ((v: number) =>
      Number.isInteger(v)
        ? v.toLocaleString()
        : v.toLocaleString(undefined, { maximumFractionDigits: 2 }))

  const deltaPill = (
    <KpiDeltaPill
      pct={pct}
      trend={trend}
      comparisonUnavailable={unavailable}
      negativeMetric={negativeMetric}
    />
  )

  const selectedStyle: CSSProperties | undefined =
    selected && accentColor
      ? { borderTopWidth: 3, borderTopColor: accentColor, borderTopStyle: 'solid' }
      : undefined

  const body = (
    <>
      <div className="flex w-full min-w-0 items-center gap-1">
        <div className="flex min-w-0 flex-1 items-center gap-0.5">
          <span className="min-w-0 truncate text-xs font-medium leading-tight text-text-primary">
            {label}
          </span>
          {helpText ? <KpiHelpButton helpText={helpText} stopClick={selectable} /> : null}
        </div>
        {dragHandle}
      </div>

      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span
            className={cn(
              'font-numeric min-w-0 text-lg font-medium leading-none tracking-tight',
              placeholder
                ? 'text-text-secondary'
                : kpiValueToneClass(numericValue, 'text-text-primary'),
              valueClassName,
            )}
          >
            {placeholder ? placeholderLabel : value}
          </span>
          {!placeholder && currencyCode ? (
            <span className="text-sm font-medium text-text-secondary">{currencyCode}</span>
          ) : null}
        </div>
        {showInlineDelta ? (
          deltaTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0 cursor-default">{deltaPill}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px] text-left text-xs font-normal leading-snug">
                {deltaTooltip}
              </TooltipContent>
            </Tooltip>
          ) : (
            deltaPill
          )
        ) : null}
      </div>

      {showDeltaRow ? (
        <div
          className="flex min-w-0 flex-wrap items-center gap-1.5"
          aria-label={`${vsPriorLabel}: ${priorValueDisplay ?? '—'}`}
        >
          <span className="font-numeric min-w-0 text-xs tabular-nums text-text-secondary">
            {priorValueDisplay ?? '—'}
          </span>
          {deltaPill}
        </div>
      ) : null}

      {showSparkline ? (
        <div className="mt-auto h-14 w-full min-w-0 pt-1.5">
          <KpiSparkline
            points={sparkData}
            metricLabel={sparklineMetricLabel ?? label}
            formatValue={formatSparkValue}
          />
        </div>
      ) : null}

      {footer ? (
        <div
          className={cn(
            'mt-auto pt-1 text-[0.65rem] leading-tight text-text-tertiary',
            footerClassName,
          )}
        >
          {footer}
        </div>
      ) : null}
    </>
  )

  const shellClassName = cn(
    'flex min-w-0 flex-col text-left',
    showSparkline && 'min-h-[148px]',
    bare
      ? 'gap-1.5'
      : compact
        ? cn(surfaceKpiCompactClassName, 'gap-1.5')
        : cn(surfaceKpiClassName, 'gap-1.5'),
    placeholder && 'opacity-80',
    selectable && 'cursor-pointer transition-colors hover:bg-muted/35',
    selected && 'bg-muted/30',
    className,
  )

  if (selectable && onSelect) {
    return (
      <div
        data-kpi-card-shell
        role="button"
        tabIndex={0}
        className={shellClassName}
        style={selectedStyle}
        aria-pressed={selected}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect()
          }
        }}
      >
        {body}
      </div>
    )
  }

  return (
    <article data-kpi-card-shell className={shellClassName} style={selectedStyle}>
      {body}
    </article>
  )
}
