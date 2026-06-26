import { useMemo, useState } from 'react'

import { chartLineActiveDot, chartLineDot } from '@/pages/dashboard/chart-line-dot'
import {
  CHART_LINE_MAIN_MS,
  CHART_LINE_MINI_MS,
  rechartsEnterAnimationProps,
} from '@/pages/dashboard/use-chart-line-load-animation'

import type { Locale } from 'date-fns'
import type { ChannelTimeSeriesRow, RevenueSeriesGranularity } from '@/lib/types/reports'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '@/lib/utils'
import { eachRevenueBucketMeta } from '@/pages/reports/reports-ui-helpers'

import { DashboardZoomStrip } from './dashboard-zoom-strip'

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

/** Matches filter pills / donut: show integration platform (Shopify, Amazon, …), not shop domains. */
function formatPlatformName(platform: string): string {
  const trimmed = platform.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function channelLabel(platform: string): string {
  return formatPlatformName(platform) || '—'
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

type ChannelSalesTooltipPayloadItem = {
  name?: string
  value?: number | string
  color?: string
  fill?: string
  dataKey?: string | number
}

function ChannelSalesTooltip({
  active,
  label,
  payload,
  formatValue,
}: {
  active?: boolean
  label?: string | number
  payload?: readonly ChannelSalesTooltipPayloadItem[]
  formatValue: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  const title = label !== undefined && label !== null ? String(label) : ''
  return (
    <div className="rounded-md border border-border-default bg-background px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      {title ? <div className="mb-1.5 font-medium text-text-primary">{title}</div> : null}
      <div className="space-y-1 leading-snug">
        {payload.map((entry, i) => {
          const raw = entry.value
          const n = typeof raw === 'number' ? raw : Number(raw ?? 0)
          const swatch = entry.color ?? entry.fill ?? 'var(--text-tertiary)'
          const key = `${String(entry.dataKey ?? '')}-${String(entry.name ?? '')}-${i}`
          return (
            <div key={key} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums">
              <span className="inline-flex items-center gap-1.5 text-text-secondary">
                <span className="size-2 shrink-0 rounded-full" style={{ background: swatch }} aria-hidden />
                <span>{entry.name ?? ''}:</span>
              </span>
              <span className="font-medium text-text-primary">{formatValue(n)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export type DashboardChannelSalesChartProps = {
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

type IndexedRow = {
  label: string
  __idx: number
  ovTotGross: number
  ovTotNet: number
  [key: string]: string | number
}

export function DashboardChannelSalesChart({
  startDate,
  endDate,
  granularity,
  rows,
  currency,
  convertValue,
  formatValue,
  dateLocale,
  t,
}: DashboardChannelSalesChartProps) {
  const channelsOrdered = useMemo(() => {
    const totals = new Map<
      string,
      { gross: number; platform: string; shop_domain: string | null }
    >()
    for (const r of rows) {
      const prev = totals.get(r.connection_id) ?? {
        gross: 0,
        platform: r.platform,
        shop_domain: r.shop_domain,
      }
      prev.gross += r.gross_revenue
      totals.set(r.connection_id, prev)
    }
    return [...totals.entries()]
      .sort((a, b) => b[1].gross - a[1].gross)
      .map(([connection_id, meta]) => ({
        connection_id,
        platform: meta.platform,
        shop_domain: meta.shop_domain,
      }))
  }, [rows])

  const fullRows: IndexedRow[] = useMemo(() => {
    const buckets = eachRevenueBucketMeta(startDate, endDate, granularity, dateLocale)
    const byBK = new Map<string, Map<string, { g: number; n: number }>>()
    for (const r of rows) {
      const bk = r.bucket_start.slice(0, 10)
      let inner = byBK.get(bk)
      if (!inner) {
        inner = new Map()
        byBK.set(bk, inner)
      }
      const cell = inner.get(r.connection_id) ?? { g: 0, n: 0 }
      cell.g += r.gross_revenue
      cell.n += r.net_revenue
      inner.set(r.connection_id, cell)
    }

    return buckets.map((b, __idx) => {
      const row: IndexedRow = {
        label: b.label,
        __idx,
        ovTotGross: 0,
        ovTotNet: 0,
      }
      let tg = 0
      let tn = 0
      channelsOrdered.forEach((ch, i) => {
        const cell = byBK.get(b.bucketKey)?.get(ch.connection_id)
        const g = convertValue(cell?.g ?? 0)
        const n = convertValue(cell?.n ?? 0)
        row[`g${i}`] = g
        row[`n${i}`] = n
        tg += g
        tn += n
      })
      row.ovTotGross = tg
      row.ovTotNet = tn
      return row
    })
  }, [channelsOrdered, convertValue, dateLocale, endDate, granularity, rows, startDate])

  const zoomResetKey = useMemo(() => {
    const sig = fullRows
      .map((r) => `${String(r.label)}:${String(r.ovTotGross)}:${String(r.ovTotNet)}`)
      .join(';')
    return `${startDate}|${endDate}|${granularity}|${channelsOrdered.length}|${sig}`
  }, [channelsOrdered.length, endDate, fullRows, granularity, startDate])

  const [zoomRangeKey, setZoomRangeKey] = useState(zoomResetKey)
  const [zoomStart, setZoomStart] = useState(0)
  const [zoomEnd, setZoomEnd] = useState(() => Math.max(0, fullRows.length - 1))
  const [hiddenKeys, setHiddenKeys] = useState<Record<string, boolean>>({})

  const toggleLegendKey = (key: string) => {
    setHiddenKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (zoomResetKey !== zoomRangeKey) {
    setZoomRangeKey(zoomResetKey)
    const n = fullRows.length
    setZoomStart(0)
    setZoomEnd(n === 0 ? 0 : n - 1)
  }

  const visibleData = useMemo(() => {
    if (fullRows.length === 0) return fullRows
    const start = Math.max(0, Math.min(zoomStart, fullRows.length - 1))
    const end = Math.max(start, Math.min(zoomEnd, fullRows.length - 1))
    return fullRows.slice(start, end + 1)
  }, [fullRows, zoomStart, zoomEnd])

  const denseMain = visibleData.length > 18

  const mainAnimProps = rechartsEnterAnimationProps(CHART_LINE_MAIN_MS)
  const miniAnimProps = rechartsEnterAnimationProps(CHART_LINE_MINI_MS)

  if (channelsOrdered.length === 0) {
    return (
      <p className="rounded-md px-2 py-10 text-center text-sm text-text-secondary">
        {t('dashboardChannelSalesEmpty')}
      </p>
    )
  }

  const lines = channelsOrdered.flatMap((ch, i) => {
    const lbl = channelLabel(ch.platform)
    const stroke = PALETTE[i % PALETTE.length]
    const gKey = `g${i}`
    const nKey = `n${i}`
    return [
      <Line
        key={`g-${ch.connection_id}`}
        type="monotone"
        dataKey={gKey}
        name={`${lbl} · ${t('reportsGrossRevenue')}`}
        stroke={stroke}
        strokeWidth={2}
        dot={chartLineDot(stroke)}
        activeDot={chartLineActiveDot(stroke)}
        opacity={hiddenKeys[gKey] ? 0.18 : 1}
        {...mainAnimProps}
      />,
      <Line
        key={`n-${ch.connection_id}`}
        type="monotone"
        dataKey={nKey}
        name={`${lbl} · ${t('reportsNetRevenue')}`}
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray="6 4"
        dot={false}
        activeDot={chartLineActiveDot(stroke)}
        opacity={hiddenKeys[nKey] ? 0.18 : 1}
        {...mainAnimProps}
      />,
    ]
  })

  return (
    <div
      className={cn(
        'w-full min-w-0 [&_.recharts-surface:focus]:outline-none [&_.recharts-layer:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none [&_.recharts-brush-traveller:focus]:outline-none',
      )}
    >
      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          key={zoomResetKey}
          data={visibleData}
          margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
        >
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border-default)' }}
            tickLine={false}
            interval={denseMain ? 'preserveStartEnd' : 0}
          />
          <YAxis
            tickFormatter={(v) => fmtMoneyCompact(Number(v), currency)}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<ChannelSalesTooltip formatValue={formatValue} />}
            wrapperStyle={{ outline: 'none' }}
            contentStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              boxShadow: 'none',
            }}
          />
          {lines}
        </LineChart>
      </ResponsiveContainer>

      <DashboardZoomStrip
        dataWithIdx={fullRows}
        zoomStart={zoomStart}
        zoomEnd={zoomEnd}
        onBrushChange={(s, e) => {
          setZoomStart(s)
          setZoomEnd(e)
        }}
        ariaLabel={t('dashboardRevenueBrushAria')}
        miniSeries={
          <>
            <Line
              type="monotone"
              dataKey="ovTotGross"
              stroke="var(--chart-1)"
              strokeWidth={1.25}
              dot={false}
              {...miniAnimProps}
            />
            <Line
              type="monotone"
              dataKey="ovTotNet"
              stroke="var(--chart-3)"
              strokeWidth={1.25}
              strokeDasharray="4 3"
              dot={false}
              {...miniAnimProps}
            />
          </>
        }
      />

      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {channelsOrdered.flatMap((ch, i) => {
          const lbl = channelLabel(ch.platform)
          const stroke = PALETTE[i % PALETTE.length]
          const gKey = `g${i}`
          const nKey = `n${i}`
          const grossHidden = Boolean(hiddenKeys[gKey])
          const netHidden = Boolean(hiddenKeys[nKey])
          return [
            <button
              key={gKey}
              type="button"
              onClick={() => toggleLegendKey(gKey)}
              className={cn(
                'inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
                grossHidden ? 'opacity-40' : 'opacity-100',
              )}
            >
              <span
                className="inline-block h-0.5 w-4 shrink-0 rounded"
                style={{ background: stroke }}
                aria-hidden
              />
              <span className="truncate">{`${lbl} · ${t('reportsGrossRevenue')}`}</span>
            </button>,
            <button
              key={nKey}
              type="button"
              onClick={() => toggleLegendKey(nKey)}
              className={cn(
                'inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
                netHidden ? 'opacity-40' : 'opacity-100',
              )}
            >
              <span
                className="inline-block h-0.5 w-4 shrink-0 rounded border-t-2 border-dashed"
                style={{ borderColor: stroke }}
                aria-hidden
              />
              <span className="truncate">{`${lbl} · ${t('reportsNetRevenue')}`}</span>
            </button>,
          ]
        })}
      </div>
    </div>
  )
}
