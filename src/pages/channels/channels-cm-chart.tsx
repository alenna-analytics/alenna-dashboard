import { useMemo, useState } from 'react'

import type { Locale } from 'date-fns'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ChannelTimeSeriesRow, RevenueSeriesGranularity } from '@/lib/types/reports'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ChannelPlatform } from '@/pages/channels/channels-platform-aggregate'
import { eachRevenueBucketMeta } from '@/pages/reports/reports-ui-helpers'
import { cn } from '@/lib/utils'
import { ChartTooltipFrame } from '@/ui/chart-tooltip'
import type { SeriesChartView } from '@/ui/chart-view-toggle'

const PLATFORM_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function fmtMoneyCompact(value: number, currency: string): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

type ChannelsCmChartProps = {
  startDate: string
  endDate: string
  granularity: RevenueSeriesGranularity
  rows: ChannelTimeSeriesRow[]
  formatValue: (value: number) => string
  convertValue: (value: number) => number
  currency: string
  dateLocale: Locale
  platforms: ChannelPlatform[]
  t: (key: ShellStringKey) => string
  cmIncomplete?: boolean
  chartType?: SeriesChartView
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
  hiddenKeys,
}: {
  active?: boolean
  label?: string | number
  payload?: readonly TooltipItem[]
  formatValue: (value: number) => string
  hiddenKeys: Record<string, boolean>
}) {
  if (!active || !payload?.length) return null
  const visible = payload.filter((entry) => {
    const key = String(entry.dataKey ?? '')
    return key && !hiddenKeys[key]
  })
  if (visible.length === 0) return null
  return (
    <ChartTooltipFrame>
      {label != null ? (
        <div className="mb-1.5 font-medium text-white">{String(label)}</div>
      ) : null}
      <div className="space-y-1">
        {visible.map((entry, i) => {
          const n = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0)
          return (
            <div
              key={`${String(entry.dataKey)}-${i}`}
              className="flex flex-wrap items-baseline gap-x-2 tabular-nums"
            >
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: entry.color }}
                  aria-hidden
                />
                {entry.name}:
              </span>
              <span className="font-medium text-white">{formatValue(n)}</span>
            </div>
          )
        })}
      </div>
    </ChartTooltipFrame>
  )
}

export function ChannelsCmChart({
  startDate,
  endDate,
  granularity,
  rows,
  formatValue,
  convertValue,
  currency,
  dateLocale,
  platforms,
  t,
  cmIncomplete = false,
  chartType = 'line',
}: ChannelsCmChartProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Record<string, boolean>>({})

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
    <div className={cn('flex h-80 w-full min-w-0 flex-col', cmIncomplete && 'opacity-80')}>
      <div className="min-h-0 min-w-0 flex-1 [&_.recharts-cartesian-axis-tick-value]:text-[12px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            barCategoryGap="28%"
            barGap={3}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => fmtMoneyCompact(v, currency)}
              width={44}
            />
            <Tooltip
              cursor={
                chartType === 'bar' ? { fill: 'var(--muted)', opacity: 0.45 } : undefined
              }
              content={<CmTooltip formatValue={formatValue} hiddenKeys={hiddenKeys} />}
            />
            {platforms.map((platform, index) => {
              const color = PLATFORM_COLORS[index % PLATFORM_COLORS.length]
              if (chartType === 'bar') {
                return (
                  <Bar
                    key={platform.slug}
                    dataKey={platform.slug}
                    name={platform.label}
                    fill={color}
                    fillOpacity={0.82}
                    radius={[8, 8, 8, 8]}
                    maxBarSize={28}
                    hide={Boolean(hiddenKeys[platform.slug])}
                    isAnimationActive={false}
                  />
                )
              }
              return (
                <Line
                  key={platform.slug}
                  type="monotone"
                  dataKey={platform.slug}
                  name={platform.label}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  hide={Boolean(hiddenKeys[platform.slug])}
                  isAnimationActive={false}
                />
              )
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {platforms.map((platform, index) => {
          const hidden = Boolean(hiddenKeys[platform.slug])
          const color = PLATFORM_COLORS[index % PLATFORM_COLORS.length]
          return (
            <button
              key={platform.slug}
              type="button"
              onClick={() =>
                setHiddenKeys((prev) => ({ ...prev, [platform.slug]: !prev[platform.slug] }))
              }
              className={cn(
                'inline-flex items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
                hidden ? 'opacity-40' : 'opacity-100',
              )}
            >
              <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ background: color }}
                aria-hidden
              />
              <span>{platform.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
