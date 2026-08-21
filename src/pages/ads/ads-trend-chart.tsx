import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatCompactNumber } from '@/lib/format/compact-number'
import { shellT } from '@/lib/i18n/shell-strings'
import type { AdsSeriesPoint } from '@/pages/ads/use-ads-kpis'
import { ChartTooltipFrame } from '@/ui/chart-tooltip'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/lib/utils'

type ChartRow = {
  label: string
  spend: number
  sales: number
}

type TooltipPayload = {
  dataKey?: string
  value?: number
  color?: string
  payload?: ChartRow
}

function TrendTooltip({
  active,
  payload,
  formatValue,
  spendLabel,
  salesLabel,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  formatValue: (value: number) => string
  spendLabel: string
  salesLabel: string
}) {
  if (!active || !payload?.[0]?.payload) return null
  const row = payload[0].payload
  return (
    <ChartTooltipFrame>
      <p className="font-medium text-white">{row.label}</p>
      <p className="mt-1 tabular-nums text-white/80">
        {spendLabel}: {formatValue(row.spend)}
      </p>
      <p className="tabular-nums text-white/80">
        {salesLabel}: {formatValue(row.sales)}
      </p>
    </ChartTooltipFrame>
  )
}

export function AdsTrendChart({
  points,
  lang,
  formatValue,
  isLoading = false,
  className,
}: {
  points: AdsSeriesPoint[]
  lang: string
  formatValue: (value: number) => string
  isLoading?: boolean
  className?: string
}) {
  const spendLabel = shellT(lang, 'adsKpiSpend')
  const salesLabel = shellT(lang, 'adsKpiSales')
  const chartRows = useMemo<ChartRow[]>(
    () =>
      points.map((point) => ({
        label: point.date.slice(5),
        spend: point.spend,
        sales: point.attributed_sales,
      })),
    [points],
  )

  if (isLoading && chartRows.length === 0) {
    return <Skeleton className={cn('h-72 w-full rounded-md', className)} aria-hidden />
  }

  if (!isLoading && chartRows.length === 0) {
    return <EmptyState size="sm" icon="home" title={shellT(lang, 'adsChartTrendEmpty')} />
  }

  return (
    <div className={cn('h-72 w-full min-w-0', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartRows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            tickFormatter={(value: number) => formatCompactNumber(Number(value), 0)}
          />
          <Tooltip
            content={
              <TrendTooltip
                formatValue={formatValue}
                spendLabel={spendLabel}
                salesLabel={salesLabel}
              />
            }
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
          />
          <Line
            type="monotone"
            dataKey="spend"
            name={spendLabel}
            stroke="var(--chart-3)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="sales"
            name={salesLabel}
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
