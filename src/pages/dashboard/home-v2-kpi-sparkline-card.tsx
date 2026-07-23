import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'

import { cn } from '@/lib/utils'
import { kpiValueToneClass } from '@/lib/kpi-value-tone'
import { KpiDeltaPill } from '@/ui/kpi-card'
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

type PctTrend = 'up' | 'down' | 'flat'

export type HomeV2SparklinePoint = {
  label: string
  value: number
}

export type HomeV2KpiSparklineCardProps = {
  label: string
  helpText?: string
  value: string
  numericValue?: number | null
  currencyCode?: string
  pct: number | null
  trend: PctTrend
  comparisonUnavailable: boolean
  negativeMetric?: boolean
  deltaTooltip?: string
  placeholder?: boolean
  placeholderLabel?: string
  sparklinePoints?: HomeV2SparklinePoint[]
  sparklineValues?: number[]
  sparklineMetricLabel?: string
  formatSparklineValue?: (value: number) => string
  sparklineId: string
  dragHandle?: ReactNode
  className?: string
}

function SparklineTooltip({
  active,
  payload,
  metricLabel,
  formatValue,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: HomeV2SparklinePoint & { index: number } }>
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

export function HomeV2KpiSparklineCard({
  label,
  helpText,
  value,
  numericValue,
  currencyCode,
  pct,
  trend,
  comparisonUnavailable,
  negativeMetric,
  deltaTooltip,
  placeholder = false,
  placeholderLabel = '—',
  sparklinePoints,
  sparklineValues = [],
  sparklineMetricLabel,
  formatSparklineValue,
  sparklineId,
  dragHandle,
  className,
}: HomeV2KpiSparklineCardProps) {
  const sparkData =
    sparklinePoints ??
    sparklineValues.map((v, index) => ({
      index,
      label: '',
      value: v,
    }))

  const gradientId = `home-v2-spark-${sparklineId}`
  const tooltipMetricLabel = sparklineMetricLabel ?? label
  const formatSparkValue =
    formatSparklineValue ??
    ((v: number) =>
      Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 }))

  return (
    <article
      data-kpi-card-shell
      className={cn(
        'flex min-h-[148px] min-w-0 flex-col rounded-md border border-border-default bg-white p-4',
        placeholder && 'opacity-80',
        className,
      )}
    >
      <div className="flex w-full min-w-0 items-start gap-1.5">
        {dragHandle}
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <span className="min-w-0 text-sm font-medium leading-tight text-text-primary">{label}</span>
          {helpText ? (
          <UiTooltip>
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
          </UiTooltip>
        ) : null}
        </div>
      </div>

      <div className="mt-2 flex min-w-0 items-baseline justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span
            className={kpiValueToneClass(
              numericValue,
              'font-numeric text-xl font-semibold leading-none tracking-tight text-text-primary',
            )}
          >
            {placeholder ? placeholderLabel : value}
          </span>
          {!placeholder && currencyCode ? (
            <span className="text-sm font-medium text-text-secondary">{currencyCode}</span>
          ) : null}
        </div>
        {!placeholder ? (
          deltaTooltip ? (
            <UiTooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0 cursor-default">
                  <KpiDeltaPill
                    pct={pct}
                    trend={trend}
                    comparisonUnavailable={comparisonUnavailable}
                    negativeMetric={negativeMetric}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px] text-left text-xs font-normal leading-snug">
                {deltaTooltip}
              </TooltipContent>
            </UiTooltip>
          ) : (
            <KpiDeltaPill
              pct={pct}
              trend={trend}
              comparisonUnavailable={comparisonUnavailable}
              negativeMetric={negativeMetric}
            />
          )
        ) : null}
      </div>

      <div className="mt-auto h-14 w-full min-w-0 pt-2">
        {sparkData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--firefly-base)" />
                  <stop offset="100%" stopColor="var(--zara-base)" />
                </linearGradient>
              </defs>
              <Tooltip
                content={
                  <SparklineTooltip
                    metricLabel={tooltipMetricLabel}
                    formatValue={formatSparkValue}
                  />
                }
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
                stroke={`url(#${gradientId})`}
                fill="none"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: 'var(--firefly-base)', stroke: 'white', strokeWidth: 1 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full rounded-sm bg-muted/20" aria-hidden />
        )}
      </div>
    </article>
  )
}
