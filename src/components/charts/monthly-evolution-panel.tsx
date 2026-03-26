import { useMemo, useState } from 'react'
import type { BarShapeProps } from 'recharts'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useCurrency } from '@/components/providers/currency-provider'
import { fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  BAR_TOP_RADIUS,
  cartesianGridProps,
  chartMargins,
  chartPlotSurfaceClassName,
  tooltipContentStyle,
  xAxisProps,
  yAxisProps,
} from './chart-theme'

/** Matches Plotly notebook: rgba(108,142,245,0.4), rgba(102,187,106,0.6), ACCENT #6c8ef5, line #fbbf24 */
const NET_BAR_FILL = 'rgba(108,142,245,0.4)'
const UB_BAR_FILL = 'rgba(102,187,106,0.6)'
const EBITDA_BAR_FILL = '#6c8ef5'
const MARGIN_LINE_STROKE = '#fbbf24'
const MARGIN_LINE_DASH = '4 3 2 3'

export type MonthlyBarLayout = 'grouped' | 'stacked'

export type MonthlyEvolutionPoint = {
  period: string
  net_revenue: number
  gross_profit: number
  ebitda: number
  margin_pct: number
  monthlyOverlayMax: number
}

export type MonthlyEvolutionTitleLabels = {
  netRevenue: string
  grossProfit: string
  ebitda: string
  marginPct: string
}

type MonthlyEvolutionPanelProps = {
  data: MonthlyEvolutionPoint[]
  titleLabels: MonthlyEvolutionTitleLabels
  barLayout: MonthlyBarLayout
  heightClassName?: string
}

type PayloadEntry = {
  dataKey?: string | number
  name?: string
  value?: number | string
  color?: string
}

type NestedMetricId = 'net' | 'ub' | 'ebitda'

const NESTED_TIE: Record<NestedMetricId, number> = { net: 0, ub: 1, ebitda: 2 }

export type MonthlySeriesKey = 'net_revenue' | 'gross_profit' | 'ebitda' | 'margin_pct'

const DEFAULT_SERIES_VISIBLE: Record<MonthlySeriesKey, boolean> = {
  net_revenue: true,
  gross_profit: true,
  ebitda: true,
  margin_pct: true,
}

function monthlyOverlayNestedShape(
  props: BarShapeProps,
  seriesVisible: Record<MonthlySeriesKey, boolean>,
) {
  const p = props.payload as MonthlyEvolutionPoint
  const { x, y, width, height } = props
  const vn = seriesVisible.net_revenue ? Math.max(0, p.net_revenue) : 0
  const ub = seriesVisible.gross_profit ? Math.max(0, p.gross_profit) : 0
  const eb = seriesVisible.ebitda ? Math.max(0, p.ebitda) : 0
  const m = Math.max(0, p.monthlyOverlayMax)
  if (m <= 0 || width <= 0 || height <= 0) return null
  const zeroY = y + height
  const items = [
    { id: 'net' as const, value: vn, fill: NET_BAR_FILL },
    { id: 'ub' as const, value: ub, fill: UB_BAR_FILL },
    { id: 'ebitda' as const, value: eb, fill: EBITDA_BAR_FILL },
  ].filter((it) => it.value > 0)
  items.sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value
    return NESTED_TIE[a.id] - NESTED_TIE[b.id]
  })
  return (
    <g>
      {items.map((it) => {
        const h = (it.value / m) * height
        const yTop = zeroY - h
        return (
          <Rectangle
            key={it.id}
            x={x}
            y={yTop}
            width={width}
            height={h}
            fill={it.fill}
            radius={BAR_TOP_RADIUS}
          />
        )
      })}
    </g>
  )
}

function payloadValue(payload: readonly unknown[] | undefined, candidateKeys: readonly string[]): number | undefined {
  if (!payload?.length) return undefined
  const keySet = new Set(candidateKeys)
  for (const raw of payload) {
    if (raw === null || typeof raw !== 'object') continue
    const o = raw as PayloadEntry
    const dk = o.dataKey
    if (typeof dk !== 'string' && typeof dk !== 'number') continue
    if (!keySet.has(String(dk))) continue
    const value = o.value
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
    return Number.isNaN(num) ? undefined : num
  }
  return undefined
}

function monthlyRowFromTooltipPayload(payload: readonly unknown[] | undefined): MonthlyEvolutionPoint | undefined {
  if (!payload?.length) return undefined
  const raw = payload[0]
  if (raw === null || typeof raw !== 'object') return undefined
  const pl = (raw as Record<string, unknown>).payload
  if (!pl || typeof pl !== 'object') return undefined
  const o = pl as Record<string, unknown>
  const net = Number(o.net_revenue)
  const gp = Number(o.gross_profit)
  const eb = Number(o.ebitda)
  const mg = Number(o.margin_pct)
  if (![net, gp, eb, mg].every((v) => Number.isFinite(v))) return undefined
  return {
    period: String(o.period ?? ''),
    net_revenue: net,
    gross_profit: gp,
    ebitda: eb,
    margin_pct: mg,
    monthlyOverlayMax: Math.max(net, gp, eb),
  }
}

const TOOLTIP_SWATCH: Record<string, string> = {
  net_revenue: NET_BAR_FILL,
  gross_profit: UB_BAR_FILL,
  ebitda: EBITDA_BAR_FILL,
  margin_pct: MARGIN_LINE_STROKE,
}

function MonthlyEvolutionTooltipContent({
  active,
  payload,
  label,
  formatCurrency,
  titleLabels,
  seriesVisible,
}: {
  active?: boolean
  payload?: readonly unknown[]
  label?: unknown
  formatCurrency: (n: number) => string
  titleLabels: MonthlyEvolutionTitleLabels
  seriesVisible: Record<MonthlySeriesKey, boolean>
}) {
  if (!active || !payload?.length) return null

  const row = monthlyRowFromTooltipPayload(payload)

  const defs: { key: MonthlySeriesKey; pct: boolean; label: string }[] = [
    { key: 'net_revenue', pct: false, label: titleLabels.netRevenue },
    { key: 'gross_profit', pct: false, label: titleLabels.grossProfit },
    { key: 'ebitda', pct: false, label: titleLabels.ebitda },
    { key: 'margin_pct', pct: true, label: titleLabels.marginPct },
  ]

  const labelText = label != null ? String(label) : ''

  return (
    <div style={{ ...tooltipContentStyle, padding: '10px 12px' }}>
      {labelText ? (
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>{labelText}</div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {defs.map(({ key, pct, label: lbl }) => {
          if (!seriesVisible[key]) return null
          const v =
            payloadValue(payload, [key]) ??
            (row
              ? key === 'net_revenue'
                ? row.net_revenue
                : key === 'gross_profit'
                  ? row.gross_profit
                  : key === 'ebitda'
                    ? row.ebitda
                    : row.margin_pct
              : undefined)
          if (v === undefined || Number.isNaN(Number(v))) return null
          const swatch = TOOLTIP_SWATCH[key]
          return (
            <div key={key} className="flex justify-between gap-6 text-[12px] leading-snug">
              <span className="flex min-w-0 items-center gap-2 text-text-secondary">
                <span
                  className="inline-block size-2.5 shrink-0 rounded-sm border border-white/10"
                  style={{ background: swatch }}
                  aria-hidden
                />
                {lbl}
              </span>
              <span className="tabular-nums text-text-primary">
                {pct ? fmtPct(Number(v)) : formatCurrency(Number(v))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MonthlyChartLegend({
  titleLabels,
  seriesVisible,
  onToggle,
}: {
  titleLabels: MonthlyEvolutionTitleLabels
  seriesVisible: Record<MonthlySeriesKey, boolean>
  onToggle: (key: MonthlySeriesKey) => void
}) {
  const items: {
    key: MonthlySeriesKey
    label: string
    fill?: string
    line?: boolean
  }[] = [
    { key: 'net_revenue', label: titleLabels.netRevenue, fill: NET_BAR_FILL },
    { key: 'gross_profit', label: titleLabels.grossProfit, fill: UB_BAR_FILL },
    { key: 'ebitda', label: titleLabels.ebitda, fill: EBITDA_BAR_FILL },
    { key: 'margin_pct', label: titleLabels.marginPct, line: true },
  ]
  return (
    <div
      className="mt-1.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 px-1 text-[10px]"
      style={{ fontFamily: 'var(--font-mono)' }}
      role="group"
      aria-label="Series visibility"
    >
      {items.map((it) => {
        const on = seriesVisible[it.key]
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => {
              onToggle(it.key)
            }}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-1 py-0.5 transition-colors',
              'hover:border-border-subtle hover:bg-white/5',
              on ? 'text-text-secondary' : 'text-text-tertiary opacity-45',
            )}
            aria-pressed={on}
          >
            {it.line ? (
              <svg width={18} height={10} viewBox="0 0 18 10" aria-hidden className="shrink-0">
                <line
                  x1={1}
                  y1={5}
                  x2={17}
                  y2={5}
                  stroke={MARGIN_LINE_STROKE}
                  strokeWidth={2}
                  strokeDasharray="4 3 2 3"
                  opacity={on ? 1 : 0.35}
                />
              </svg>
            ) : (
              <span
                className="inline-block size-2.5 shrink-0 rounded-sm border border-white/10"
                style={{ background: it.fill, opacity: on ? 1 : 0.35 }}
              />
            )}
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

export function MonthlyEvolutionPanel({
  data,
  titleLabels,
  barLayout,
  heightClassName = 'h-[280px]',
}: MonthlyEvolutionPanelProps) {
  const { formatCurrency } = useCurrency()
  const overlay = barLayout === 'stacked'
  const [seriesVisible, setSeriesVisible] = useState<Record<MonthlySeriesKey, boolean>>(DEFAULT_SERIES_VISIBLE)

  const composedData = useMemo(() => {
    if (!overlay) return data
    return data.map((row) => {
      const maxBar = Math.max(
        seriesVisible.net_revenue ? Math.max(0, row.net_revenue) : 0,
        seriesVisible.gross_profit ? Math.max(0, row.gross_profit) : 0,
        seriesVisible.ebitda ? Math.max(0, row.ebitda) : 0,
        0,
      )
      return { ...row, monthlyOverlayMax: maxBar }
    })
  }, [data, overlay, seriesVisible])

  const overlayShape = useMemo(
    () => (props: BarShapeProps) => monthlyOverlayNestedShape(props, seriesVisible),
    [seriesVisible],
  )

  const toggleSeries = (key: MonthlySeriesKey) => {
    setSeriesVisible((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className={cn('w-full', chartPlotSurfaceClassName)}>
      <div className={cn('w-full', heightClassName)}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={composedData} margin={chartMargins}>
            <CartesianGrid {...cartesianGridProps} />
            <XAxis dataKey="period" {...xAxisProps} />
            <YAxis {...yAxisProps} tickFormatter={(v) => formatCurrency(v)} width={56} includeHidden={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              {...yAxisProps}
              tickFormatter={(v) => fmtPct(Number(v))}
              width={56}
              includeHidden={false}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={(props) => (
                <MonthlyEvolutionTooltipContent
                  {...props}
                  formatCurrency={formatCurrency}
                  titleLabels={titleLabels}
                  seriesVisible={seriesVisible}
                />
              )}
            />
            {overlay ? (
              <Bar
                dataKey="monthlyOverlayMax"
                legendType="none"
                fill="transparent"
                stroke="none"
                isAnimationActive={false}
                shape={overlayShape}
              />
            ) : (
              <>
                <Bar
                  dataKey="net_revenue"
                  name={titleLabels.netRevenue}
                  fill={NET_BAR_FILL}
                  radius={BAR_TOP_RADIUS}
                  hide={!seriesVisible.net_revenue}
                />
                <Bar
                  dataKey="gross_profit"
                  name={titleLabels.grossProfit}
                  fill={UB_BAR_FILL}
                  radius={BAR_TOP_RADIUS}
                  hide={!seriesVisible.gross_profit}
                />
                <Bar
                  dataKey="ebitda"
                  name={titleLabels.ebitda}
                  fill={EBITDA_BAR_FILL}
                  radius={BAR_TOP_RADIUS}
                  hide={!seriesVisible.ebitda}
                />
              </>
            )}
            <Line
              type="monotone"
              dataKey="margin_pct"
              name={titleLabels.marginPct}
              yAxisId="right"
              stroke={MARGIN_LINE_STROKE}
              strokeWidth={2}
              strokeDasharray={MARGIN_LINE_DASH}
              dot={{ r: 4, fill: MARGIN_LINE_STROKE, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: MARGIN_LINE_STROKE }}
              hide={!seriesVisible.margin_pct}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <MonthlyChartLegend titleLabels={titleLabels} seriesVisible={seriesVisible} onToggle={toggleSeries} />
    </div>
  )
}

