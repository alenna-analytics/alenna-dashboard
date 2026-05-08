import { useMemo, useState } from 'react'

import type { Locale } from 'date-fns'
import type { ChannelTimeSeriesRow, RevenueSeriesGranularity } from '@/lib/types/reports'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
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

import { cn } from '@/lib/utils'
import { eachRevenueBucketMeta } from '@/pages/reports/reports-ui-helpers'

import { DashboardZoomStrip } from './dashboard-zoom-strip'

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

type ProfitMarginTooltipPayloadItem = {
  name?: string
  value?: number | string
  color?: string
  fill?: string
  dataKey?: string | number
}

function ProfitMarginTooltip({
  active,
  label,
  payload,
  formatValue,
  marginPctLabel,
}: {
  active?: boolean
  label?: string | number
  payload?: readonly ProfitMarginTooltipPayloadItem[]
  formatValue: (value: number) => string
  marginPctLabel: string
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
          const text =
            entry.name === marginPctLabel ? `${n.toFixed(1)}%` : formatValue(n)
          const key = `${String(entry.dataKey ?? '')}-${String(entry.name ?? '')}-${i}`
          return (
            <div key={key} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums">
              <span className="inline-flex items-center gap-1.5 text-text-secondary">
                <span className="size-2 shrink-0 rounded-full" style={{ background: swatch }} aria-hidden />
                <span>{entry.name ?? ''}:</span>
              </span>
              <span className="font-medium text-text-primary">{text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export type DashboardProfitMarginChartProps = {
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
  stkProfit: number
  stkMid: number
  stkTop: number
  marginPct: number
  ovTotGross: number
  ovTotNet: number
}

export function DashboardProfitMarginChart({
  startDate,
  endDate,
  granularity,
  rows,
  currency,
  convertValue,
  formatValue,
  dateLocale,
  t,
}: DashboardProfitMarginChartProps) {
  const fullRows: IndexedRow[] = useMemo(() => {
    const buckets = eachRevenueBucketMeta(startDate, endDate, granularity, dateLocale)
    const byBK = new Map<
      string,
      { gross: number; net: number; profit: number }
    >()
    for (const r of rows) {
      const bk = r.bucket_start.slice(0, 10)
      const prev = byBK.get(bk) ?? { gross: 0, net: 0, profit: 0 }
      prev.gross += r.gross_revenue
      prev.net += r.net_revenue
      prev.profit += r.gross_profit
      byBK.set(bk, prev)
    }

    return buckets.map((b, __idx) => {
      const agg = byBK.get(b.bucketKey) ?? { gross: 0, net: 0, profit: 0 }
      const gross = convertValue(agg.gross)
      const net = convertValue(agg.net)
      const profit = convertValue(agg.profit)
      const netClamped = Math.min(net, gross)
      const profitClamped = Math.min(profit, netClamped)
      const mid = Math.max(0, netClamped - profitClamped)
      const top = Math.max(0, gross - netClamped)
      const marginPct = netClamped > 0 ? (profitClamped / netClamped) * 100 : 0
      return {
        label: b.label,
        __idx,
        stkProfit: profitClamped,
        stkMid: mid,
        stkTop: top,
        marginPct,
        ovTotGross: gross,
        ovTotNet: netClamped,
      }
    })
  }, [convertValue, dateLocale, endDate, granularity, rows, startDate])

  const zoomResetKey = useMemo(
    () => `${startDate}|${endDate}|${granularity}|${fullRows.length}`,
    [endDate, fullRows.length, granularity, startDate],
  )

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

  const composedChartData = useMemo(
    () =>
      visibleData.map((row) => ({
        ...row,
        stkProfit: hiddenKeys.stkProfit ? 0 : row.stkProfit,
        stkMid: hiddenKeys.stkMid ? 0 : row.stkMid,
        stkTop: hiddenKeys.stkTop ? 0 : row.stkTop,
      })),
    [hiddenKeys, visibleData],
  )

  const denseMain = visibleData.length > 18

  return (
    <div
      className={cn(
        'w-full min-w-0 [&_.recharts-surface:focus]:outline-none [&_.recharts-layer:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none [&_.recharts-brush-traveller:focus]:outline-none',
      )}
    >
      <ResponsiveContainer width="100%" height={312}>
        <ComposedChart data={composedChartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border-default)' }}
            tickLine={false}
            interval={denseMain ? 'preserveStartEnd' : 0}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => fmtMoneyCompact(Number(v), currency)}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              <ProfitMarginTooltip
                formatValue={formatValue}
                marginPctLabel={t('reportsMonthlyLegendGrossMarginPct')}
              />
            }
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
          <Bar
            yAxisId="left"
            dataKey="stkProfit"
            name={t('reportsGrossProfit')}
            stackId="tot"
            fill="var(--chart-4)"
            radius={[0, 0, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            yAxisId="left"
            dataKey="stkMid"
            name={t('dashboardProfitStackNetMinusProfit')}
            stackId="tot"
            fill="var(--chart-3)"
            isAnimationActive={false}
          />
          <Bar
            yAxisId="left"
            dataKey="stkTop"
            name={t('dashboardProfitStackMerchAdj')}
            stackId="tot"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="marginPct"
            name={t('reportsMonthlyLegendGrossMarginPct')}
            stroke="var(--danger)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'var(--danger)', strokeWidth: 0 }}
            opacity={hiddenKeys.marginPct ? 0.18 : 1}
            isAnimationActive={false}
          />
        </ComposedChart>
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
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="ovTotNet"
              stroke="var(--chart-3)"
              strokeWidth={1.25}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
          </>
        }
      />

      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        <button
          type="button"
          onClick={() => toggleLegendKey('stkProfit')}
          className={cn(
            'inline-flex items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
            hiddenKeys.stkProfit ? 'opacity-40' : 'opacity-100',
          )}
        >
          <span className="inline-block h-2 w-4 shrink-0 rounded-sm bg-[var(--chart-4)]" aria-hidden />
          <span>{t('reportsGrossProfit')}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleLegendKey('stkMid')}
          className={cn(
            'inline-flex items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
            hiddenKeys.stkMid ? 'opacity-40' : 'opacity-100',
          )}
        >
          <span className="inline-block h-2 w-4 shrink-0 rounded-sm bg-[var(--chart-3)]" aria-hidden />
          <span>{t('dashboardProfitStackNetMinusProfit')}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleLegendKey('stkTop')}
          className={cn(
            'inline-flex items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
            hiddenKeys.stkTop ? 'opacity-40' : 'opacity-100',
          )}
        >
          <span className="inline-block h-2 w-4 shrink-0 rounded-sm bg-[var(--chart-1)]" aria-hidden />
          <span>{t('dashboardProfitStackMerchAdj')}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleLegendKey('marginPct')}
          className={cn(
            'inline-flex items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
            hiddenKeys.marginPct ? 'opacity-40' : 'opacity-100',
          )}
        >
          <span
            className="inline-block h-0.5 w-4 shrink-0 rounded bg-[var(--danger)]"
            aria-hidden
          />
          <span>{t('reportsMonthlyLegendGrossMarginPct')}</span>
        </button>
      </div>
    </div>
  )
}
