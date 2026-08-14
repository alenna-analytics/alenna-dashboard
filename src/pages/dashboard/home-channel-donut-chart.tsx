import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatCompactNumber } from '@/lib/format/compact-number'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ChannelBreakdownRow } from '@/lib/types/reports'
import { cn } from '@/lib/utils'
import { ChartTooltipFrame } from '@/ui/chart-tooltip'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { TOP_PRODUCTS_PAIRED_MIN_HEIGHT_CLASS } from '@/pages/dashboard/home-top-products-chart-layout'

const TOP_N = 5

export type HomeChannelDonutChartProps = {
  rows: ChannelBreakdownRow[]
  convertValue: (value: number) => number
  formatValue: (value: number) => string
  formatCompact?: (value: number) => string
  t: (key: ShellStringKey) => string
  minBodyHeightPx?: number
  isLoading?: boolean
}

type ChartRow = {
  key: string
  label: string
  value: number
}

type TooltipPayload = {
  payload?: ChartRow
}

function platformLabel(platform: string): string {
  if (!platform) return ''
  return platform[0].toUpperCase() + platform.slice(1)
}

function rowLabel(row: ChannelBreakdownRow): string {
  return platformLabel(row.platform) || row.connection_id
}

function ChannelTooltip({
  active,
  payload,
  formatValue,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  formatValue: (value: number) => string
}) {
  if (!active || !payload?.[0]?.payload) return null
  const row = payload[0].payload
  return (
    <ChartTooltipFrame>
      <p className="font-medium text-white">{row.label}</p>
      <p className="mt-0.5 tabular-nums text-white/70">{formatValue(row.value)}</p>
    </ChartTooltipFrame>
  )
}

export function HomeChannelDonutChart({
  rows,
  convertValue,
  formatValue,
  t,
  minBodyHeightPx,
  isLoading = false,
}: HomeChannelDonutChartProps) {
  const chartRows = useMemo<ChartRow[]>(() => {
    const sorted = [...rows].sort((a, b) => b.gross_revenue - a.gross_revenue)
    const head = sorted.slice(0, TOP_N).map((r) => ({
      key: r.connection_id,
      label: rowLabel(r),
      value: convertValue(r.gross_revenue),
    }))
    const tail = sorted.slice(TOP_N)
    if (tail.length > 0) {
      head.push({
        key: '__overflow__',
        label: t('homeChannelDonutOther'),
        value: tail.reduce((acc, r) => acc + convertValue(r.gross_revenue), 0),
      })
    }
    return head.filter((s) => s.value > 0)
  }, [rows, convertValue, t])

  const total = useMemo(
    () => chartRows.reduce((acc, row) => acc + row.value, 0),
    [chartRows],
  )

  if (isLoading && chartRows.length === 0) {
    return (
      <Skeleton
        className={cn('h-40 w-full', minBodyHeightPx !== undefined && TOP_PRODUCTS_PAIRED_MIN_HEIGHT_CLASS)}
        aria-hidden
      />
    )
  }

  if (!isLoading && (chartRows.length === 0 || total === 0)) {
    return <EmptyState size="sm" icon="home" title={t('homeChannelDonutEmpty')} />
  }

  return (
    <div
      className={cn(
        'h-40 w-full min-w-0',
        minBodyHeightPx !== undefined && TOP_PRODUCTS_PAIRED_MIN_HEIGHT_CLASS,
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartRows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          />
          <YAxis
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            tickFormatter={(value: number) => formatCompactNumber(Number(value), 0)}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
            content={<ChannelTooltip formatValue={formatValue} />}
          />
          <Bar
            dataKey="value"
            fill="var(--chart-3)"
            radius={[2, 2, 0, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
