import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
import type { ShareChartView } from '@/ui/chart-view-toggle'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/lib/utils'

const CHANNEL_PALETTE = [
  'var(--chart-1)',
  'var(--chart-3)',
  'var(--chart-2)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--text-tertiary)',
] as const

type ChartRow = {
  key: string
  label: string
  value: number
  fill: string
}

type TooltipPayload = {
  payload?: ChartRow
}

function ChannelTooltip({
  active,
  payload,
  formatValue,
  total,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  formatValue: (value: number) => string
  total: number
}) {
  if (!active || !payload?.[0]?.payload) return null
  const row = payload[0].payload
  const pct = total > 0 ? Math.round((row.value / total) * 100) : 0
  return (
    <ChartTooltipFrame>
      <p className="font-medium text-white">{row.label}</p>
      <p className="mt-0.5 tabular-nums text-white/70">
        {formatValue(row.value)} · {pct}%
      </p>
    </ChartTooltipFrame>
  )
}

export function AdsChannelSpendChart({
  rows,
  lang,
  formatValue,
  isLoading = false,
  chartType = 'bar',
  className,
}: {
  rows: AdsChannelRow[]
  lang: string
  formatValue: (value: number) => string
  isLoading?: boolean
  chartType?: ShareChartView
  className?: string
}) {
  const chartRows = useMemo<ChartRow[]>(() => {
    return [...rows]
      .map((row) => ({
        key: row.connection_id ?? row.platform,
        label: adsPlatformLabel(row.platform, lang),
        value: row.spend,
        fill: CHANNEL_PALETTE[0],
      }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((row, index) => ({
        ...row,
        fill: CHANNEL_PALETTE[index % CHANNEL_PALETTE.length],
      }))
  }, [rows, lang])

  const total = useMemo(
    () => chartRows.reduce((acc, row) => acc + row.value, 0),
    [chartRows],
  )

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

  if (chartType === 'pie') {
    const compactTotal = formatCompactNumber(total, 0)
    return (
      <div className={cn('flex h-72 w-full min-w-0 flex-col', className)}>
        <div className="relative min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartRows}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={1.5}
                stroke="var(--background)"
                strokeWidth={1}
                isAnimationActive={false}
              >
                {chartRows.map((row) => (
                  <Cell key={row.key} fill={row.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChannelTooltip formatValue={formatValue} total={total} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[11px] text-text-tertiary">
              {shellT(lang, 'homeChannelDonutCenterLabel')}
            </p>
            <p className="text-sm font-semibold tabular-nums text-text-primary">{compactTotal}</p>
          </div>
        </div>
        <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {chartRows.map((row) => (
            <li key={row.key} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="size-2 shrink-0 rounded-sm" style={{ background: row.fill }} aria-hidden />
              {row.label}
            </li>
          ))}
        </ul>
      </div>
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
            content={<ChannelTooltip formatValue={formatValue} total={total} />}
          />
          <Bar dataKey="value" radius={[8, 8, 8, 8]} maxBarSize={28} isAnimationActive={false}>
            {chartRows.map((row) => (
              <Cell key={row.key} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
