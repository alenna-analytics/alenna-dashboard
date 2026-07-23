import { useMemo, useState } from 'react'
import type { Locale } from 'date-fns'
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

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { MonthlyRevenueMonthRow, RevenueSeriesGranularity } from '@/lib/types/reports'
import { cn } from '@/lib/utils'
import { chartLineActiveDot, chartLineDot } from '@/pages/dashboard/chart-line-dot'
import {
  CHART_LINE_MAIN_MS,
  CHART_LINE_MINI_MS,
  rechartsEnterAnimationProps,
} from '@/pages/dashboard/use-chart-line-load-animation'
import {
  formatHomeV2TrendMetricValue,
  homeV2TrendMetricLabel,
  homeV2TrendMetricValue,
  isHomeV2TrendMetricCount,
  type HomeV2TrendMetricContext,
  type HomeV2TrendMetricId,
} from '@/pages/dashboard/home-v2-trend-metrics'
import { mergeRevenueSeriesRows } from '@/pages/reports/monthly-revenue-chart'

export type HomeV2SalesTrendChartProps = {
  startDate: string
  endDate: string
  granularity: RevenueSeriesGranularity
  rows: MonthlyRevenueMonthRow[]
  currency: string
  formatValue: (value: number) => string
  dateLocale: Locale
  primaryMetric: HomeV2TrendMetricId
  secondaryMetric: HomeV2TrendMetricId
  metricContext: HomeV2TrendMetricContext
  t: (key: ShellStringKey) => string
}

type TrendRow = {
  label: string
  primary: number
  secondary: number
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

function fmtCountCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function TrendTooltip({
  active,
  payload,
  primaryLabel,
  secondaryLabel,
  primaryMetric,
  secondaryMetric,
  formatValue,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: TrendRow }>
  primaryLabel: string
  secondaryLabel: string
  primaryMetric: HomeV2TrendMetricId
  secondaryMetric: HomeV2TrendMetricId
  formatValue: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as TrendRow | undefined
  if (!row) return null
  return (
    <div className="rounded-md border border-border-default bg-white px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      <p className="mb-1.5 font-medium text-text-primary">{row.label}</p>
      <div className="space-y-1 leading-snug">
        <p className="tabular-nums">
          <span className="text-text-tertiary">{primaryLabel}:</span>{' '}
          <span className="font-medium text-text-primary">
            {formatHomeV2TrendMetricValue(primaryMetric, row.primary, formatValue)}
          </span>
        </p>
        <p className="tabular-nums">
          <span className="text-text-tertiary">{secondaryLabel}:</span>{' '}
          <span className="font-medium text-text-primary">
            {formatHomeV2TrendMetricValue(secondaryMetric, row.secondary, formatValue)}
          </span>
        </p>
      </div>
    </div>
  )
}

export function HomeV2SalesTrendChart({
  startDate,
  endDate,
  granularity,
  rows,
  currency,
  formatValue,
  dateLocale,
  primaryMetric,
  secondaryMetric,
  metricContext,
  t,
}: HomeV2SalesTrendChartProps) {
  const primaryLabel = homeV2TrendMetricLabel(primaryMetric, metricContext, t)
  const secondaryLabel = homeV2TrendMetricLabel(secondaryMetric, metricContext, t)
  const primaryIsCount = isHomeV2TrendMetricCount(primaryMetric)
  const secondaryIsCount = isHomeV2TrendMetricCount(secondaryMetric)
  const useDualAxis = primaryIsCount !== secondaryIsCount

  const data = useMemo((): TrendRow[] => {
    return mergeRevenueSeriesRows(startDate, endDate, granularity, rows, dateLocale).map((row) => ({
      label: row.label,
      primary: homeV2TrendMetricValue(row, primaryMetric, metricContext),
      secondary: homeV2TrendMetricValue(row, secondaryMetric, metricContext),
    }))
  }, [
    startDate,
    endDate,
    granularity,
    rows,
    dateLocale,
    primaryMetric,
    secondaryMetric,
    metricContext,
  ])

  const dataWithIndex: TrendRowIndexed[] = useMemo(
    () => data.map((d, i) => ({ ...d, __idx: i })),
    [data],
  )

  const zoomResetKey = useMemo(() => {
    const sig = data.map((d) => `${d.label}:${d.primary}:${d.secondary}`).join(';')
    return `${startDate}|${endDate}|${granularity}|${primaryMetric}|${secondaryMetric}|${sig}`
  }, [startDate, endDate, granularity, primaryMetric, secondaryMetric, data])

  const [zoomRangeKey, setZoomRangeKey] = useState(zoomResetKey)
  const [zoomStart, setZoomStart] = useState(0)
  const [zoomEnd, setZoomEnd] = useState(() => Math.max(0, data.length - 1))
  const [hiddenKeys, setHiddenKeys] = useState<Record<string, boolean>>({})

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

  const x1Label =
    dataWithIndex[Math.max(0, Math.min(zoomStart, Math.max(0, dataWithIndex.length - 1)))]?.label
  const x2Label =
    dataWithIndex[Math.max(0, Math.min(zoomEnd, Math.max(0, dataWithIndex.length - 1)))]?.label

  const dense = visibleData.length > 18
  const mainAnimProps = rechartsEnterAnimationProps(CHART_LINE_MAIN_MS)
  const miniAnimProps = rechartsEnterAnimationProps(CHART_LINE_MINI_MS)

  const toggleLegendKey = (key: string) => {
    setHiddenKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const primaryAxisId = useDualAxis ? 'primary' : 'left'
  const secondaryAxisId = useDualAxis ? 'secondary' : 'left'

  return (
    <div
      className={cn(
        'w-full min-w-0 py-3 [&_.recharts-surface:focus]:outline-none [&_.recharts-layer:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none [&_.recharts-brush-traveller:focus]:outline-none',
      )}
    >
      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          key={zoomResetKey}
          data={visibleData}
          margin={{ top: 8, right: useDualAxis ? 8 : 8, left: 4, bottom: 4 }}
        >
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border-default)' }}
            tickLine={false}
            interval={dense ? 'preserveStartEnd' : 0}
          />
          <YAxis
            yAxisId={primaryAxisId}
            orientation="left"
            tickFormatter={(v) =>
              primaryIsCount ? fmtCountCompact(Number(v)) : fmtMoneyCompact(Number(v), currency)
            }
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          {useDualAxis ? (
            <YAxis
              yAxisId="secondary"
              orientation="right"
              tickFormatter={(v) =>
                secondaryIsCount
                  ? fmtCountCompact(Number(v))
                  : fmtMoneyCompact(Number(v), currency)
              }
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
          ) : null}
          <Tooltip
            content={
              <TrendTooltip
                primaryLabel={primaryLabel}
                secondaryLabel={secondaryLabel}
                primaryMetric={primaryMetric}
                secondaryMetric={secondaryMetric}
                formatValue={formatValue}
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
          <Line
            type="monotone"
            dataKey="primary"
            name={primaryLabel}
            yAxisId={primaryAxisId}
            stroke="var(--chart-3)"
            strokeWidth={2.5}
            dot={chartLineDot('var(--chart-3)')}
            activeDot={chartLineActiveDot('var(--chart-3)')}
            opacity={hiddenKeys.primary ? 0.18 : 1}
            {...mainAnimProps}
          />
          <Line
            type="monotone"
            dataKey="secondary"
            name={secondaryLabel}
            yAxisId={secondaryAxisId}
            stroke="var(--chart-monthly-gross-bar)"
            strokeWidth={2}
            dot={false}
            opacity={hiddenKeys.secondary ? 0.18 : 1}
            {...mainAnimProps}
          />
        </LineChart>
      </ResponsiveContainer>

      {dataWithIndex.length > 0 ? (
        <div className="mt-2 rounded-md border border-border-subtle/70 bg-white px-1 py-1">
          <div className="relative h-16 w-full">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  key={`${zoomResetKey}-mini`}
                  data={dataWithIndex}
                  margin={{ top: 4, right: 4, left: 4, bottom: 2 }}
                >
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
                    dataKey="primary"
                    stroke="var(--chart-3)"
                    strokeWidth={1.5}
                    dot={false}
                    opacity={hiddenKeys.primary ? 0.2 : 0.9}
                    {...miniAnimProps}
                  />
                  <Line
                    type="monotone"
                    dataKey="secondary"
                    stroke="var(--chart-monthly-gross-bar)"
                    strokeWidth={1.25}
                    dot={false}
                    opacity={hiddenKeys.secondary ? 0.2 : 0.9}
                    {...miniAnimProps}
                  />
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
          onClick={() => toggleLegendKey('primary')}
          className={cn(
            'inline-flex items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
            hiddenKeys.primary ? 'opacity-40' : 'opacity-100',
          )}
        >
          <span className="inline-block h-0.5 w-4 rounded bg-[var(--chart-3)]" aria-hidden />
          <span>{primaryLabel}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleLegendKey('secondary')}
          className={cn(
            'inline-flex items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
            hiddenKeys.secondary ? 'opacity-40' : 'opacity-100',
          )}
        >
          <span className="inline-block h-0.5 w-4 rounded bg-[var(--chart-monthly-gross-bar)]" aria-hidden />
          <span>{secondaryLabel}</span>
        </button>
      </div>
    </div>
  )
}
