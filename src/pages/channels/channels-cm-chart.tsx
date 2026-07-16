import { useMemo } from 'react'

import type { Locale } from 'date-fns'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ChannelTimeSeriesRow, RevenueSeriesGranularity } from '@/lib/types/reports'
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

import type { ChannelPlatform } from '@/pages/channels/channels-platform-aggregate'
import { eachRevenueBucketMeta } from '@/pages/reports/reports-ui-helpers'

const PLATFORM_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

type ChannelsCmChartProps = {
  startDate: string
  endDate: string
  granularity: RevenueSeriesGranularity
  rows: ChannelTimeSeriesRow[]
  formatValue: (value: number) => string
  convertValue: (value: number) => number
  dateLocale: Locale
  platforms: ChannelPlatform[]
  t: (key: ShellStringKey) => string
}

type ChartRow = {
  label: string
  [key: string]: string | number
}

type TooltipItem = {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

function CmTooltip({
  active,
  label,
  payload,
  formatValue,
}: {
  active?: boolean
  label?: string | number
  payload?: readonly TooltipItem[]
  formatValue: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border-default bg-background px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      {label != null ? (
        <div className="mb-1.5 font-medium text-text-primary">{String(label)}</div>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const n = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0)
          return (
            <div
              key={`${String(entry.dataKey)}-${i}`}
              className="flex flex-wrap items-baseline gap-x-2 tabular-nums"
            >
              <span className="inline-flex items-center gap-1.5 text-text-secondary">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: entry.color }}
                  aria-hidden
                />
                {entry.name}:
              </span>
              <span className="font-medium text-text-primary">{formatValue(n)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ChannelsCmChart({
  startDate,
  endDate,
  granularity,
  rows,
  formatValue,
  convertValue,
  dateLocale,
  platforms,
  t,
}: ChannelsCmChartProps) {
  const data = useMemo((): ChartRow[] => {
    const buckets = eachRevenueBucketMeta(startDate, endDate, granularity, dateLocale)
    const byBucketPlatform = new Map<string, number>()
    const platformSlugs = new Set(platforms.map((platform) => platform.slug))
    for (const row of rows) {
      const slug = row.platform.trim().toLowerCase()
      if (!platformSlugs.has(slug)) continue
      const key = `${row.bucket_start}|${slug}`
      byBucketPlatform.set(
        key,
        (byBucketPlatform.get(key) ?? 0) + convertValue(row.contribution_margin),
      )
    }
    return buckets.map((bucket) => {
      const point: ChartRow = { label: bucket.label }
      for (const platform of platforms) {
        point[platform.slug] =
          byBucketPlatform.get(`${bucket.bucketKey}|${platform.slug}`) ?? 0
      }
      return point
    })
  }, [rows, platforms, startDate, endDate, granularity, dateLocale, convertValue])

  const hasData = data.some((point) =>
    platforms.some((platform) => Number(point[platform.slug] ?? 0) !== 0),
  )

  if (!hasData) {
    return (
      <p className="rounded-md px-2 py-6 text-sm text-text-secondary">{t('reportsNoData')}</p>
    )
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatValue(v)}
            width={72}
          />
          <Tooltip content={<CmTooltip formatValue={formatValue} />} />
          <Legend />
          {platforms.map((platform, index) => (
            <Line
              key={platform.slug}
              type="monotone"
              dataKey={platform.slug}
              name={platform.label}
              stroke={PLATFORM_COLORS[index % PLATFORM_COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
