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
import { EmptyState } from '@/ui/empty-state'
import { chartLineActiveDot, chartLineDot } from '@/pages/dashboard/chart-line-dot'
import {
  CHART_LINE_MAIN_MS,
  CHART_LINE_MINI_MS,
  rechartsEnterAnimationProps,
} from '@/pages/dashboard/use-chart-line-load-animation'
import { mergeRevenueSeriesRows } from '@/pages/reports/monthly-revenue-chart'

import {
  formatProductDetailTrendMetricValue,
  isProductDetailTrendMetricCount,
  isProductDetailTrendMetricPct,
  PRODUCT_DETAIL_METRIC_COLORS,
  productDetailTrendMetricLabel,
  productDetailTrendSeriesValue,
  type ProductDetailTrendMetricId,
} from './product-detail-trend-metrics'

export type ProductDetailTrendChartProps = {
  startDate: string
  endDate: string
  granularity: RevenueSeriesGranularity
  rows: MonthlyRevenueMonthRow[]
  selectedMetrics: ProductDetailTrendMetricId[]
  formatMoney: (value: number) => string
  dateLocale: Locale
  t: (key: ShellStringKey) => string
}

type ChartRow = Record<string, number | string> & { label: string; __idx: number }

function fmtMoneyCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function fmtCountCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function fmtPctCompact(value: number): string {
  return `${value.toFixed(0)}%`
}

type AxisKind = 'money' | 'count' | 'pct'

function metricAxisKind(id: ProductDetailTrendMetricId): AxisKind {
  if (isProductDetailTrendMetricPct(id)) return 'pct'
  if (isProductDetailTrendMetricCount(id)) return 'count'
  return 'money'
}

function MultiTrendTooltip({
  active,
  payload,
  selectedMetrics,
  formatMoney,
  t,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ChartRow }>
  selectedMetrics: ProductDetailTrendMetricId[]
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="rounded-md border border-border-default bg-white px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      <p className="mb-1.5 font-medium text-text-primary">{String(row.label)}</p>
      <div className="space-y-1 leading-snug">
        {selectedMetrics.map((id) => (
          <p key={id} className="tabular-nums">
            <span className="text-text-tertiary">{productDetailTrendMetricLabel(id, t)}:</span>{' '}
            <span className="font-medium text-text-primary">
              {formatProductDetailTrendMetricValue(id, Number(row[id] ?? 0), formatMoney)}
            </span>
          </p>
        ))}
      </div>
    </div>
  )
}

export function ProductDetailTrendChart({
  startDate,
  endDate,
  granularity,
  rows,
  selectedMetrics,
  formatMoney,
  dateLocale,
  t,
}: ProductDetailTrendChartProps) {
  const chartMetrics = selectedMetrics.filter((id) => id !== 'inventory-days')
  const axisKinds = useMemo(
    () => new Set(chartMetrics.map((id) => metricAxisKind(id))),
    [chartMetrics],
  )
  const useDualAxis = axisKinds.size > 1

  const data = useMemo((): ChartRow[] => {
    return mergeRevenueSeriesRows(startDate, endDate, granularity, rows, dateLocale).map(
      (row, index) => {
        const point: ChartRow = { label: row.label, __idx: index }
        for (const id of chartMetrics) {
          point[id] = productDetailTrendSeriesValue(row, id)
        }
        return point
      },
    )
  }, [startDate, endDate, granularity, rows, dateLocale, chartMetrics])

  const zoomResetKey = useMemo(() => {
    const sig = data
      .map((d) => chartMetrics.map((id) => `${id}:${d[id]}`).join(','))
      .join(';')
    return `${startDate}|${endDate}|${granularity}|${chartMetrics.join(',')}|${sig}`
  }, [startDate, endDate, granularity, chartMetrics, data])

  const [zoomRangeKey, setZoomRangeKey] = useState(zoomResetKey)
  const [zoomStart, setZoomStart] = useState(0)
  const [zoomEnd, setZoomEnd] = useState(() => Math.max(0, data.length - 1))
  const [hiddenKeys, setHiddenKeys] = useState<Record<string, boolean>>({})

  if (zoomResetKey !== zoomRangeKey) {
    setZoomRangeKey(zoomResetKey)
    const n = data.length
    setZoomStart(0)
    setZoomEnd(n === 0 ? 0 : n - 1)
  }

  const visibleData = useMemo(() => {
    if (data.length === 0) return data
    const start = Math.max(0, Math.min(zoomStart, data.length - 1))
    const end = Math.max(start, Math.min(zoomEnd, data.length - 1))
    return data.slice(start, end + 1)
  }, [data, zoomStart, zoomEnd])

  const x1Label = data[Math.max(0, Math.min(zoomStart, Math.max(0, data.length - 1)))]?.label
  const x2Label = data[Math.max(0, Math.min(zoomEnd, Math.max(0, data.length - 1)))]?.label

  const primaryMetric = chartMetrics[0]
  const primaryKind: AxisKind = primaryMetric ? metricAxisKind(primaryMetric) : 'money'
  const secondaryMetricId =
    chartMetrics.find((id) => metricAxisKind(id) !== primaryKind) ?? null
  const secondaryKind: AxisKind | null = secondaryMetricId
    ? metricAxisKind(secondaryMetricId)
    : null

  const formatAxisTick = (kind: AxisKind) => (value: number) => {
    if (kind === 'count') return fmtCountCompact(value)
    if (kind === 'pct') return fmtPctCompact(value)
    return fmtMoneyCompact(value)
  }

  const mainAnimProps = rechartsEnterAnimationProps(CHART_LINE_MAIN_MS)
  const miniAnimProps = rechartsEnterAnimationProps(CHART_LINE_MINI_MS)
  const dense = visibleData.length > 18

  if (chartMetrics.length === 0) {
    return <EmptyState title={t('productsDetailMetricsTrendSelectHint')} />
  }

  return (
    <div className="w-full min-w-0 py-3 [&_.recharts-brush-traveller:focus]:outline-none [&_.recharts-layer:focus]:outline-none [&_.recharts-surface:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none">
      <ResponsiveContainer width="100%" height={220}>
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
            yAxisId="left"
            orientation="left"
            tickFormatter={formatAxisTick(primaryKind)}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          {useDualAxis && secondaryKind ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatAxisTick(secondaryKind)}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
          ) : null}
          <Tooltip
            content={
              <MultiTrendTooltip
                selectedMetrics={chartMetrics}
                formatMoney={formatMoney}
                t={t}
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
          {chartMetrics.map((id, index) => {
            const kind = metricAxisKind(id)
            const yAxisId =
              !useDualAxis || kind === primaryKind
                ? 'left'
                : secondaryKind != null && kind === secondaryKind
                  ? 'right'
                  : 'left'
            const color = PRODUCT_DETAIL_METRIC_COLORS[id]
            return (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                name={productDetailTrendMetricLabel(id, t)}
                yAxisId={yAxisId}
                stroke={color}
                strokeWidth={index === 0 ? 2.5 : 2}
                dot={index === 0 ? chartLineDot(color) : false}
                activeDot={chartLineActiveDot(color)}
                opacity={hiddenKeys[id] ? 0.18 : 1}
                {...mainAnimProps}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>

      {data.length > 0 ? (
        <div className="mt-2 rounded-md border border-border-subtle/70 bg-white px-1 py-1">
          <div className="relative h-16 w-full">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  key={`${zoomResetKey}-mini`}
                  data={data}
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
                  {chartMetrics.map((id) => (
                    <Line
                      key={`mini-${id}`}
                      type="monotone"
                      dataKey={id}
                      stroke={PRODUCT_DETAIL_METRIC_COLORS[id]}
                      strokeWidth={1.25}
                      dot={false}
                      opacity={hiddenKeys[id] ? 0.2 : 0.9}
                      {...miniAnimProps}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
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
        {chartMetrics.map((id) => (
          <button
            key={`legend-${id}`}
            type="button"
            onClick={() => setHiddenKeys((prev) => ({ ...prev, [id]: !prev[id] }))}
            className={cn(
              'inline-flex items-center gap-1.5 text-text-secondary outline-none transition-opacity focus:outline-none',
              hiddenKeys[id] ? 'opacity-40' : 'opacity-100',
            )}
          >
            <span
              className="inline-block h-0.5 w-4 rounded"
              style={{ backgroundColor: PRODUCT_DETAIL_METRIC_COLORS[id] }}
              aria-hidden
            />
            <span>{productDetailTrendMetricLabel(id, t)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
