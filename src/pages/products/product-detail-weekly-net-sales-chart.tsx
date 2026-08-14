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

import { ChartTooltipFrame } from '@/ui/chart-tooltip'

import type { ProductWeeklyNetSalesPointApi } from '@/lib/types/catalog'
import { chartLineActiveDot, chartLineDot } from '@/pages/dashboard/chart-line-dot'
import { CHART_NARROW_MQ, lineChartXAxisLayout } from '@/pages/dashboard/chart-x-axis-layout'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  CHART_LINE_MINI_MS,
  rechartsEnterAnimationProps,
} from '@/pages/dashboard/use-chart-line-load-animation'

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
    <ChartTooltipFrame>
      <p className="text-white/70">
        <span className="font-medium text-white">{tooltipLabels.week}:</span>{' '}
        {row.weekLabel}
      </p>
      <p className="mt-1 font-numeric tabular-nums text-white/70">
        <span className="font-medium text-white">{tooltipLabels.sales}:</span>{' '}
        {formatValue(row.value)}
      </p>
    </ChartTooltipFrame>
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
  const isNarrow = useMediaQuery(CHART_NARROW_MQ)
  const xAxis = lineChartXAxisLayout(isNarrow)

  const chartRevealKey = useMemo(
    () => chartData.map((p) => `${p.weekStart}:${p.value}`).join('|'),
    [chartData],
  )

  const lineAnimProps = rechartsEnterAnimationProps(CHART_LINE_MINI_MS)

  if (chartData.length === 0) {
    return null
  }

  const lineStroke = 'var(--country-green-base)'

  return (
    <div
      className={
        isNarrow
          ? 'h-52 w-full min-w-0 [&_.recharts-surface:focus]:outline-none [&_.recharts-layer:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none'
          : 'h-40 w-full min-w-0 [&_.recharts-surface:focus]:outline-none [&_.recharts-layer:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none'
      }
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          key={chartRevealKey}
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: isNarrow ? 8 : 0 }}
        >
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
            interval={xAxis.interval}
            minTickGap={xAxis.minTickGap}
            angle={xAxis.angle}
            textAnchor={xAxis.textAnchor}
            height={xAxis.height}
            tickMargin={xAxis.tickMargin}
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
            dot={chartLineDot(lineStroke)}
            activeDot={chartLineActiveDot(lineStroke)}
            {...lineAnimProps}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
