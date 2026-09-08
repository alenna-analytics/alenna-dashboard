import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

import { cn } from '@/lib/utils'
import { kpiValueToneClass } from '@/lib/kpi-value-tone'
import { AppIcon } from '@/ui/app-icon'
import { ChartTooltipFrame, ChartTooltipSeriesRow, ChartTooltipTitle } from '@/ui/chart-tooltip'
import { InfoTooltip } from '@/ui/info-tooltip'
import {
  surfaceCardClassName,
} from '@/ui/surface'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

type PctTrend = 'up' | 'down' | 'flat'

type KpiCardVariant = 'default' | 'featured'

type DeltaPillProps = {
  pct: number | null
  trend: PctTrend
  comparisonUnavailable: boolean
  negativeMetric?: boolean
  className?: string
}

const SPARKLINE_STROKE = '#6e8f40'

export const kpiCardGridClassName =
  'grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4'

export type KpiSparklinePoint = {
  label: string
  value: number
}

function deltaTone(
  pct: number | null,
  trend: PctTrend,
  comparisonUnavailable: boolean,
  negativeMetric: boolean | undefined,
): 'good' | 'bad' | 'neutral' {
  if (comparisonUnavailable || pct === null || trend === 'flat') return 'neutral'
  const invert = Boolean(negativeMetric)
  const good = invert ? trend === 'down' : trend === 'up'
  const bad = invert ? trend === 'up' : trend === 'down'
  if (good) return 'good'
  if (bad) return 'bad'
  return 'neutral'
}

/** Inline MoM/YoY delta: growth/decrease icon before the % (no pill). */
export function KpiDeltaPill({
  pct,
  trend,
  comparisonUnavailable,
  negativeMetric,
  className,
}: DeltaPillProps) {
  const empty = comparisonUnavailable || pct === null
  const tone = deltaTone(pct, trend, comparisonUnavailable, negativeMetric)
  let pctStr = '—'
  if (!empty && pct !== null) {
    pctStr = `${trend === 'up' && pct > 0 ? '+' : ''}${pct.toFixed(1)} %`
  }
  const iconName = trend === 'up' ? 'growth' : trend === 'down' ? 'decrease' : null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-numeric text-sm font-medium tabular-nums leading-none',
        tone === 'good' && 'text-[var(--kpi-pill-positive-text)]',
        tone === 'bad' && 'text-[var(--kpi-pill-negative-text)]',
        tone === 'neutral' && 'text-text-secondary',
        className,
      )}
    >
      {!empty && iconName ? (
        <AppIcon name={iconName} colorize className="size-3.5 shrink-0" />
      ) : null}
      <span>{pctStr}</span>
    </span>
  )
}

function SparklineTooltip({
  active,
  payload,
  coordinate,
  containerEl,
  metricLabel,
  formatValue,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: KpiSparklinePoint }>
  coordinate?: { x: number; y: number }
  containerEl: HTMLDivElement | null
  metricLabel: string
  formatValue: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row || !coordinate || !containerEl) return null
  const rect = containerEl.getBoundingClientRect()
  const left = Math.min(Math.max(rect.left + coordinate.x, 88), window.innerWidth - 88)
  const top = rect.top + coordinate.y
  return createPortal(
    <div
      className="pointer-events-none fixed z-80"
      style={{
        left,
        top,
        transform: 'translate(-50%, calc(-100% - 8px))',
      }}
    >
      <ChartTooltipFrame>
        <ChartTooltipTitle>{row.label}</ChartTooltipTitle>
        <div className="space-y-1.5">
          <ChartTooltipSeriesRow
            color={SPARKLINE_STROKE}
            label={metricLabel}
            value={formatValue(row.value)}
          />
        </div>
      </ChartTooltipFrame>
    </div>,
    document.body,
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
  const fillId = useId().replace(/:/g, '')
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  if (points.length <= 1) {
    return <div className="h-full w-full bg-muted/20" aria-hidden />
  }
  return (
    <div ref={setContainerEl} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SPARKLINE_STROKE} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SPARKLINE_STROKE} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <RechartsTooltip
            content={
              <SparklineTooltip
                containerEl={containerEl}
                metricLabel={metricLabel}
                formatValue={formatValue}
              />
            }
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ outline: 'none', visibility: 'hidden' }}
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
            fill={`url(#${fillId})`}
            strokeWidth={2}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            dot={false}
            activeDot={{ r: 3, fill: SPARKLINE_STROKE, stroke: 'white', strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
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
  /** Chart-style breakdown shown next to the big number (info icon). */
  valueTooltip?: ReactNode
  placeholder?: boolean
  placeholderLabel?: string
  compact?: boolean
  bare?: boolean
  footer?: ReactNode
  footerClassName?: string
  /** Extra node under the value (e.g. margin % badge), home-style. */
  valueAddon?: ReactNode
  valueClassName?: string
  className?: string
  dragHandle?: ReactNode
  sparklinePoints?: KpiSparklinePoint[]
  sparklineValues?: number[]
  sparklineMetricLabel?: string
  formatSparklineValue?: (value: number) => string
  sparklineExpandLabel?: string
  sparklineCollapseLabel?: string
  sparklineOpen?: boolean
  onSparklineOpenChange?: (open: boolean) => void
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
  valueTooltip,
  placeholder = false,
  placeholderLabel = '—',
  bare = false,
  footer,
  footerClassName,
  valueAddon,
  valueClassName,
  className,
  dragHandle,
  sparklinePoints,
  sparklineValues = [],
  sparklineMetricLabel,
  formatSparklineValue,
  sparklineExpandLabel = 'Show trend',
  sparklineCollapseLabel = 'Hide trend',
  sparklineOpen: sparklineOpenProp,
  onSparklineOpenChange,
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
  const canExpandSparkline = sparkData.length > 0
  const sparklineControlled = sparklineOpenProp !== undefined
  const [sparklineOpenUncontrolled, setSparklineOpenUncontrolled] = useState(false)
  const sparklineOpen = sparklineControlled ? sparklineOpenProp : sparklineOpenUncontrolled
  const setSparklineOpen = (open: boolean) => {
    if (!sparklineControlled) setSparklineOpenUncontrolled(open)
    onSparklineOpenChange?.(open)
  }
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

  const deltaEl = showInlineDelta ? (
    deltaTooltip ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex w-fit cursor-default">{deltaPill}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-left text-xs font-normal leading-snug">
          {deltaTooltip}
        </TooltipContent>
      </Tooltip>
    ) : (
      deltaPill
    )
  ) : null

  const selectedStyle: CSSProperties | undefined =
    selected && accentColor
      ? { borderTopWidth: 3, borderTopColor: accentColor, borderTopStyle: 'solid' }
      : undefined

  const body = (
    <>
      <div className={cn('flex min-w-0 flex-1 flex-col gap-1.5', !bare && 'p-3')}>
        <div className="flex w-full min-w-0 items-center gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-0.5">
            <span className="min-w-0 truncate text-xs font-medium leading-tight text-text-primary">
              {label}
            </span>
            {helpText ? (
              <InfoTooltip side="top" stopClick={selectable}>
                {helpText}
              </InfoTooltip>
            ) : null}
          </div>
          {canExpandSparkline ? (
            <button
              type="button"
              className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-tertiary outline-none transition-colors hover:bg-[var(--sidebar-accent)] hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-expanded={sparklineOpen}
              aria-label={sparklineOpen ? sparklineCollapseLabel : sparklineExpandLabel}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setSparklineOpen(!sparklineOpen)
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <ChevronDown
                className={cn(
                  'size-3.5 transition-transform duration-300 ease-out',
                  sparklineOpen && 'rotate-180',
                )}
                aria-hidden
              />
            </button>
          ) : null}
          {dragHandle}
        </div>

        <div className="flex min-w-0 flex-col items-start gap-1.5">
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
            {deltaEl}
            {!placeholder && valueTooltip ? (
              <InfoTooltip side="top" stopClick={selectable} className="max-w-[280px] px-3 py-2">
                {valueTooltip}
              </InfoTooltip>
            ) : null}
          </div>
          {!placeholder && valueAddon ? valueAddon : null}
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

        {footer ? (
          <div
            className={cn(
              'pt-1 text-[0.65rem] leading-tight text-text-tertiary',
              footerClassName,
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>

      {canExpandSparkline ? (
        <div
          className={cn(
            'grid min-w-0 transition-[grid-template-rows] duration-300 ease-out',
            sparklineOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={cn(
                'h-14 w-full min-w-0 transition-opacity duration-300 ease-out',
                sparklineOpen ? 'opacity-100' : 'opacity-0',
              )}
            >
              <KpiSparkline
                points={sparkData}
                metricLabel={sparklineMetricLabel ?? label}
                formatValue={formatSparkValue}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )

  const shellClassName = cn(
    'flex min-w-0 w-full flex-col text-left',
    !bare && 'h-full',
    canExpandSparkline && 'overflow-hidden',
    bare
      ? 'gap-1.5'
      : cn(surfaceCardClassName, 'overflow-hidden p-0'),
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
