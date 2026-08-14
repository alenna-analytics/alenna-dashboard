import { useMemo } from 'react'

import type { Locale } from 'date-fns'
import type { ChannelTimeSeriesRow, RevenueSeriesGranularity } from '@/lib/types/reports'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { eachRevenueBucketMeta } from '@/pages/reports/reports-ui-helpers'
import { ChartTooltipFrame } from '@/ui/chart-tooltip'

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function formatPlatformName(platform: string): string {
  const trimmed = platform.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

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

type ChannelSeries = {
  connectionId: string
  label: string
  color: string
  dataKey: string
}

type ChartRow = {
  label: string
  [key: string]: string | number
}

type TooltipItem = {
  name?: string
  value?: number | string
  color?: string
  fill?: string
  dataKey?: string | number
}

function ChannelBarsTooltip({
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
  const title = label !== undefined && label !== null ? String(label) : ''
  return (
    <ChartTooltipFrame>
      {title ? <div className="mb-1.5 font-medium text-white">{title}</div> : null}
      <div className="space-y-1 leading-snug">
        {payload.map((entry, i) => {
          const raw = entry.value
          const n = typeof raw === 'number' ? raw : Number(raw ?? 0)
          const swatch = entry.color ?? entry.fill ?? 'var(--text-tertiary)'
          const key = `${String(entry.dataKey ?? '')}-${String(entry.name ?? '')}-${i}`
          return (
            <div key={key} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums">
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <span className="size-2 shrink-0 rounded-full" style={{ background: swatch }} aria-hidden />
                <span>{entry.name ?? ''}:</span>
              </span>
              <span className="font-medium text-white">{formatValue(n)}</span>
            </div>
          )
        })}
      </div>
    </ChartTooltipFrame>
  )
}

export type SalesChannelNetBarsChartProps = {
  startDate: string
  endDate: string
  granularity: RevenueSeriesGranularity
  rows: ChannelTimeSeriesRow[]
  currency: string
  convertValue: (value: number) => number
  formatValue: (value: number) => string
  dateLocale: Locale
  t: (key: ShellStringKey) => string
}

export function SalesChannelNetBarsChart({
  startDate,
  endDate,
  granularity,
  rows,
  currency,
  convertValue,
  formatValue,
  dateLocale,
  t,
}: SalesChannelNetBarsChartProps) {
  const { series, data } = useMemo(() => {
    const buckets = eachRevenueBucketMeta(startDate, endDate, granularity, dateLocale)
    const channelOrder: string[] = []
    const channelMeta = new Map<string, { platform: string }>()

    for (const r of rows) {
      if (!channelMeta.has(r.connection_id)) {
        channelOrder.push(r.connection_id)
        channelMeta.set(r.connection_id, { platform: r.platform })
      }
    }

    const seriesList: ChannelSeries[] = channelOrder.map((id, i) => {
      const meta = channelMeta.get(id)
      return {
        connectionId: id,
        label: formatPlatformName(meta?.platform ?? '') || '—',
        color: PALETTE[i % PALETTE.length] ?? 'var(--chart-1)',
        dataKey: `ch_${id}`,
      }
    })

    const byBucket = new Map<string, Map<string, number>>()
    for (const r of rows) {
      const bk = r.bucket_start.slice(0, 10)
      let m = byBucket.get(bk)
      if (!m) {
        m = new Map()
        byBucket.set(bk, m)
      }
      m.set(r.connection_id, (m.get(r.connection_id) ?? 0) + r.net_revenue)
    }

    const chartRows: ChartRow[] = buckets.map((b) => {
      const row: ChartRow = { label: b.label }
      const m = byBucket.get(b.bucketKey)
      for (const s of seriesList) {
        row[s.dataKey] = convertValue(m?.get(s.connectionId) ?? 0)
      }
      return row
    })

    return { series: seriesList, data: chartRows }
  }, [startDate, endDate, granularity, rows, dateLocale, convertValue])

  if (data.length === 0 || series.length === 0) {
    return (
      <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
        {t('dashboardChannelSalesEmpty')}
      </p>
    )
  }

  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => fmtMoneyCompact(v, currency)}
          />
          <Tooltip
            content={<ChannelBarsTooltip formatValue={formatValue} />}
            cursor={{ fill: 'var(--muted)', opacity: 0.35 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span className="text-text-secondary">{value}</span>}
          />
          {series.map((s) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.label}
              fill={s.color}
              radius={[3, 3, 0, 0]}
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
