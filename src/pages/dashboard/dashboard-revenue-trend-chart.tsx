import { useMemo, useState } from 'react'

import {
  CHART_LINE_MAIN_MS,
  CHART_LINE_MINI_MS,
  useChartLineLoadAnimation,
} from '@/pages/dashboard/use-chart-line-load-animation'

import type { Locale } from 'date-fns'
import type { MonthlyRevenueMonthRow, RevenueSeriesGranularity } from '@/lib/types/reports'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '@/lib/utils'
import { mergeRevenueSeriesRows } from '@/pages/reports/monthly-revenue-chart'

export type DashboardRevenueTrendChartProps = {
  startDate: string
  endDate: string
  prevStart: string
  prevEnd: string
  granularity: RevenueSeriesGranularity
  rowsCurrent: MonthlyRevenueMonthRow[]
  rowsPrev: MonthlyRevenueMonthRow[]
  comparePrevious: boolean
  /** Currency used for axis-tick rendering (display currency in v1). */
  currency: string
  /** Format a numeric value (already converted to display currency) for tooltips. */
  formatValue: (value: number) => string
  /** Convert a base-currency amount to display currency. */
  convertValue: (value: number) => number
  dateLocale: Locale
  t: (key: ShellStringKey) => string
}

type TrendRow = {
  label: string
  current: number
  previous: number | null
  /** Calendar month label for the comparison series at this index (may differ from `label`). */
  previousBucketLabel: string | null
}

type TrendRowIndexed = TrendRow & { __idx: number }

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

function buildTrendRows(
  startDate: string,
  endDate: string,
  prevStart: string,
  prevEnd: string,
  granularity: RevenueSeriesGranularity,
  rowsCurrent: MonthlyRevenueMonthRow[],
  rowsPrev: MonthlyRevenueMonthRow[],
  locale: Locale,
  comparePrevious: boolean,
): TrendRow[] {
  const cur = mergeRevenueSeriesRows(startDate, endDate, granularity, rowsCurrent, locale)
  if (!comparePrevious) {
    return cur.map((c) => ({
      label: c.label,
      current: c.net_revenue,
      previous: null,
      previousBucketLabel: null,
    }))
  }
  const prev = mergeRevenueSeriesRows(prevStart, prevEnd, granularity, rowsPrev, locale)
  const n = Math.min(cur.length, prev.length)
  const out: TrendRow[] = []
  for (let i = 0; i < n; i++) {
    const c = cur[i]
    const p = prev[i]
    out.push({
      label: c?.label ?? p?.label ?? '',
      current: c?.net_revenue ?? 0,
      previous: p !== undefined ? p.net_revenue : null,
      previousBucketLabel: p !== undefined ? p.label : null,
    })
  }
  return out
}

function TrendTooltip({
  active,
  payload,
  formatValue,
  comparePrevious,
  t,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: TrendRow }>
  formatValue: (value: number) => string
  comparePrevious: boolean
  t: (key: ShellStringKey) => string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as TrendRow | undefined
  if (!row) return null
  return (
    <div className="rounded-md border border-border-default bg-background px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      <div className="space-y-1.5 leading-snug">
        <p className="tabular-nums">
          <span className="text-text-tertiary">
            {t('dashboardRevenueSeriesCurrent')} ({row.label}):
          </span>{' '}
          <span className="font-medium text-text-primary">{formatValue(row.current)}</span>
        </p>
        {comparePrevious && row.previous !== null && row.previousBucketLabel ? (
          <p className="tabular-nums">
            <span className="text-text-tertiary">
              {t('dashboardRevenueSeriesPrevious')} ({row.previousBucketLabel}):
            </span>{' '}
            <span className="font-medium text-text-primary">{formatValue(row.previous)}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function DashboardRevenueTrendChart({
  startDate,
  endDate,
  prevStart,
  prevEnd,
  granularity,
  rowsCurrent,
  rowsPrev,
  comparePrevious,
  currency,
  formatValue,
  convertValue,
  dateLocale,
  t,
}: DashboardRevenueTrendChartProps) {
  const data = useMemo(() => {
    const rows = buildTrendRows(
      startDate,
      endDate,
      prevStart,
      prevEnd,
      granularity,
      rowsCurrent,
      rowsPrev,
      dateLocale,
      comparePrevious,
    )
    return rows.map((r) => ({
      ...r,
      current: convertValue(r.current),
      previous: r.previous === null ? null : convertValue(r.previous),
    }))
  }, [
    startDate,
    endDate,
    prevStart,
    prevEnd,
    granularity,
    rowsCurrent,
    rowsPrev,
    dateLocale,
    comparePrevious,
    convertValue,
  ])

  const dataWithIndex: TrendRowIndexed[] = useMemo(
    () => data.map((d, i) => ({ ...d, __idx: i })),
    [data],
  )

  const zoomResetKey = useMemo(
    () =>
      `${startDate}|${endDate}|${prevStart}|${prevEnd}|${granularity}|${String(comparePrevious)}|${dataWithIndex.length}`,
    [
      startDate,
      endDate,
      prevStart,
      prevEnd,
      granularity,
      comparePrevious,
      dataWithIndex.length,
    ],
  )

  const [zoomRangeKey, setZoomRangeKey] = useState(zoomResetKey)
  const [zoomStart, setZoomStart] = useState(0)
  const [zoomEnd, setZoomEnd] = useState(() => Math.max(0, data.length - 1))
  const [hiddenKeys, setHiddenKeys] = useState<Record<string, boolean>>({})

  const lineLoadAnim = useChartLineLoadAnimation(zoomResetKey, CHART_LINE_MAIN_MS)

  const toggleLegendKey = (key: string) => {
    setHiddenKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (zoomResetKey !== zoomRangeKey) {
    setZoomRangeKey(zoomResetKey)
    const n = dataWithIndex.length
    setZoomStart(0)
    setZoomEnd(n === 0 ? 0 : n - 1)
  }

  const visibleData = useMemo(() => {
    if (dataWithIndex.length === 0) return dataWithIndex
    const start = Math.max(0, Math.min(zoomStart, dataWithIndex.length - 1))
    const end = Math.max(start, Math.min(zoomEnd, dataWithIndex.length - 1))
    return dataWithIndex.slice(start, end + 1)
  }, [dataWithIndex, zoomStart, zoomEnd])

  const x1Label = dataWithIndex[Math.max(0, Math.min(zoomStart, Math.max(0, dataWithIndex.length - 1)))]?.label
  const x2Label = dataWithIndex[Math.max(0, Math.min(zoomEnd, Math.max(0, dataWithIndex.length - 1)))]?.label

  const denseMain = visibleData.length > 18

  return (
    <div
      className={cn(
        'w-full min-w-0 [&_.recharts-surface:focus]:outline-none [&_.recharts-layer:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none [&_.recharts-brush-traveller:focus]:outline-none',
      )}
    >
      <ResponsiveContainer width="100%" height={312}>
        <LineChart data={visibleData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
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
            content={<TrendTooltip formatValue={formatValue} comparePrevious={comparePrevious} t={t} />}
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
          <Line
            type="monotone"
            dataKey="current"
            name={t('dashboardRevenueSeriesCurrent')}
            stroke="var(--chart-3)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'var(--chart-3)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            opacity={hiddenKeys.current ? 0.18 : 1}
            isAnimationActive={lineLoadAnim}
            animationDuration={CHART_LINE_MAIN_MS}
            animationEasing="ease-out"
          />
          {comparePrevious ? (
            <Line
              type="monotone"
              dataKey="previous"
              name={t('dashboardRevenueSeriesPrevious')}
              stroke="var(--chart-line-secondary)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 2.5, fill: 'var(--chart-line-secondary)', strokeWidth: 0 }}
              connectNulls={false}
              opacity={hiddenKeys.previous ? 0.18 : 1}
              isAnimationActive={lineLoadAnim}
              animationBegin={180}
              animationDuration={CHART_LINE_MAIN_MS}
              animationEasing="ease-out"
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>

      {dataWithIndex.length > 0 ? (
        <div className="mt-2 rounded-md border border-border-subtle/70 bg-white px-1 py-1">
          <div className="relative h-16 w-full">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataWithIndex} margin={{ top: 4, right: 4, left: 4, bottom: 2 }}>
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  {x1Label !== undefined && x2Label !== undefined ? (
                    <ReferenceArea
                      x1={x1Label}
                      x2={x2Label}
                      fill="rgba(0,0,0,0.14)"
                      stroke="rgba(0,0,0,0.28)"
                      strokeWidth={1}
                      ifOverflow="extendDomain"
                    />
                  ) : null}
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="var(--chart-3)"
                    strokeWidth={1.5}
                    dot={false}
                    opacity={hiddenKeys.current ? 0.2 : 0.9}
                    isAnimationActive={lineLoadAnim}
                    animationDuration={CHART_LINE_MINI_MS}
                    animationEasing="ease-out"
                  />
                  {comparePrevious ? (
                    <Line
                      type="monotone"
                      dataKey="previous"
                      stroke="var(--chart-line-secondary)"
                      strokeWidth={1.25}
                      strokeDasharray="4 3"
                      dot={false}
                      connectNulls={false}
                      opacity={hiddenKeys.previous ? 0.2 : 0.9}
                      isAnimationActive={lineLoadAnim}
                      animationBegin={120}
                      animationDuration={CHART_LINE_MINI_MS}
                      animationEasing="ease-out"
                    />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataWithIndex} margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="__idx" hide />
                  <YAxis hide />
                  <Brush
                    dataKey="__idx"
                    height={62}
                    travellerWidth={8}
                    stroke="var(--border-default)"
                    fill="transparent"
                    startIndex={zoomStart}
                    endIndex={zoomEnd}
                    ariaLabel={t('dashboardRevenueBrushAria')}
                    onChange={(r) => {
                      if (typeof r?.startIndex === 'number') setZoomStart(r.startIndex)
                      if (typeof r?.endIndex === 'number') setZoomEnd(r.endIndex)
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        <button
          type="button"
          onClick={() => toggleLegendKey('current')}
          className={cn(
            'inline-flex items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
            hiddenKeys.current ? 'opacity-40' : 'opacity-100',
          )}
        >
          <span className="inline-block h-0.5 w-4 rounded bg-[var(--chart-3)]" aria-hidden />
          <span>{t('dashboardRevenueSeriesCurrent')}</span>
        </button>
        {comparePrevious ? (
          <button
            type="button"
            onClick={() => toggleLegendKey('previous')}
            className={cn(
              'inline-flex items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
              hiddenKeys.previous ? 'opacity-40' : 'opacity-100',
            )}
          >
            <span
              className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed border-[var(--chart-line-secondary)]"
              aria-hidden
            />
            <span>{t('dashboardRevenueSeriesPrevious')}</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
