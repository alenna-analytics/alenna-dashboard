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
import { shellT } from '@/lib/i18n/shell-strings'
import type { AdsChannelRow } from '@/pages/ads/use-ads-kpis'
import { adsPlatformLabel } from '@/pages/ads/ads-platform-label'
import { ChartTooltipFrame } from '@/ui/chart-tooltip'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/lib/utils'

type ChartRow = {
  key: string
  label: string
  value: number
}

type TooltipPayload = {
  payload?: ChartRow
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

export function AdsChannelSpendChart({
  rows,
  lang,
  formatValue,
  isLoading = false,
  className,
}: {
  rows: AdsChannelRow[]
  lang: string
  formatValue: (value: number) => string
  isLoading?: boolean
  className?: string
}) {
  const chartRows = useMemo<ChartRow[]>(() => {
    return [...rows]
      .map((row) => ({
        key: row.connection_id ?? row.platform,
        label: adsPlatformLabel(row.platform, lang),
        value: row.spend,
      }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [rows, lang])

  if (isLoading && chartRows.length === 0) {
    return <Skeleton className={cn('h-72 w-full rounded-md', className)} aria-hidden />
  }

  if (!isLoading && chartRows.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon="ads"
        title={shellT(lang, 'adsChartChannelEmpty')}
        className="h-72"
      />
    )
  }

  return (
    <div className={cn('h-72 w-full min-w-0', className)}>
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
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
