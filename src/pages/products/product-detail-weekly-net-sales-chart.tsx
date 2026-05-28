import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ProductWeeklyNetSalesPointApi } from '@/lib/types/catalog'
import {
  CHART_LINE_MINI_MS,
  createLeadingEdgeDot,
  useProgressivePointReveal,
} from '@/pages/dashboard/chart-progressive-reveal'

export type ProductWeeklyNetSalesChartPoint = {
  weekStart: string
  weekLabel: string
  value: number
}

type WeeklyNetSalesTooltipLabels = {
  week: string
  sales: string
}

type ProductDetailWeeklyNetSalesChartProps = {
  points: ProductWeeklyNetSalesPointApi[]
  weekLabelFor: (weekStart: string) => string
  formatValue: (value: number) => string
  ariaLabel: string
  tooltipLabels: WeeklyNetSalesTooltipLabels
}

const AXIS_TICK = { fontSize: 10, fill: 'var(--color-text-tertiary)' } as const

function WeeklyNetSalesTooltip({
  active,
  payload,
  formatValue,
  tooltipLabels,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ProductWeeklyNetSalesChartPoint }>
  formatValue: (value: number) => string
  tooltipLabels: WeeklyNetSalesTooltipLabels
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="rounded-md border border-border-subtle bg-popover px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      <p className="text-text-secondary">
        <span className="font-medium text-text-primary">{tooltipLabels.week}:</span>{' '}
        {row.weekLabel}
      </p>
      <p className="mt-1 font-numeric tabular-nums text-text-secondary">
        <span className="font-medium text-text-primary">{tooltipLabels.sales}:</span>{' '}
        {formatValue(row.value)}
      </p>
    </div>
  )
}

function buildWeeklyNetSalesChartPoints(
  points: ProductWeeklyNetSalesPointApi[],
  weekLabelFor: (weekStart: string) => string,
): ProductWeeklyNetSalesChartPoint[] {
  return points.map((row) => ({
    weekStart: row.week_start,
    weekLabel: weekLabelFor(row.week_start),
    value: Number(row.gross_revenue) || 0,
  }))
}

export function ProductDetailWeeklyNetSalesChart({
  points,
  weekLabelFor,
  formatValue,
  ariaLabel,
  tooltipLabels,
}: ProductDetailWeeklyNetSalesChartProps) {
  const chartData = useMemo(
    () => buildWeeklyNetSalesChartPoints(points, weekLabelFor),
    [points, weekLabelFor],
  )

  const chartRevealKey = useMemo(
    () => chartData.map((p) => `${p.weekStart}:${p.value}`).join('|'),
    [chartData],
  )

  const { revealed: chartVisibleData, leadingIndex } = useProgressivePointReveal(
    chartData,
    chartRevealKey,
    CHART_LINE_MINI_MS,
  )

  const lineDrawComplete =
    chartVisibleData.length === chartData.length && chartData.length > 0

  if (chartData.length === 0) {
    return null
  }

  const lineStroke = 'var(--country-green-base)'

  return (
    <div
      className="h-40 w-full min-w-0 [&_.recharts-surface:focus]:outline-none [&_.recharts-layer:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none"
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartVisibleData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--border-subtle)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="weekLabel"
            tick={AXIS_TICK}
            axisLine={{ stroke: 'var(--border-subtle)' }}
            tickLine={false}
            interval="preserveStartEnd"
            dy={4}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(v) => formatValue(Number(v))}
            domain={[(dataMin: number) => Math.min(0, dataMin), 'auto']}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border-default)', strokeDasharray: '4 4' }}
            content={
              <WeeklyNetSalesTooltip formatValue={formatValue} tooltipLabels={tooltipLabels} />
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineStroke}
            strokeWidth={2}
            dot={
              lineDrawComplete
                ? { r: 3, fill: lineStroke, strokeWidth: 0 }
                : createLeadingEdgeDot(leadingIndex, lineStroke, 3)
            }
            activeDot={{ r: 5, fill: lineStroke, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
