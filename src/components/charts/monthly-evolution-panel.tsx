import type { BarShapeProps } from 'recharts'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
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
  BAR_STACK_FLAT,
  BAR_TOP_RADIUS,
  CHART_COLORS,
  cartesianGridProps,
  chartMargins,
  chartPlotSurfaceClassName,
  tooltipContentStyle,
  xAxisProps,
  yAxisProps,
} from './chart-theme'

const STACK_ID = 'monthly-income'

function monthlyStackEbitdaShape(props: BarShapeProps) {
  const p = props.payload as MonthlyEvolutionPoint
  const isTop =
    (p.stackUbOverEbitda ?? 0) <= 0 &&
    (p.stackNetOverUb ?? 0) <= 0 &&
    (p.stackGrossOverNet ?? 0) <= 0 &&
    (p.stackEbitda ?? 0) > 0
  return <Rectangle {...props} radius={isTop ? BAR_TOP_RADIUS : BAR_STACK_FLAT} />
}

function monthlyStackUbShape(props: BarShapeProps) {
  const p = props.payload as MonthlyEvolutionPoint
  const isTop =
    (p.stackNetOverUb ?? 0) <= 0 &&
    (p.stackGrossOverNet ?? 0) <= 0 &&
    (p.stackUbOverEbitda ?? 0) > 0
  return <Rectangle {...props} radius={isTop ? BAR_TOP_RADIUS : BAR_STACK_FLAT} />
}

function monthlyStackNetShape(props: BarShapeProps) {
  const p = props.payload as MonthlyEvolutionPoint
  const isTop = (p.stackGrossOverNet ?? 0) <= 0 && (p.stackNetOverUb ?? 0) > 0
  return <Rectangle {...props} radius={isTop ? BAR_TOP_RADIUS : BAR_STACK_FLAT} />
}

function monthlyStackGrossOverNetShape(props: BarShapeProps) {
  const p = props.payload as MonthlyEvolutionPoint
  const isTop = (p.stackGrossOverNet ?? 0) > 0
  return <Rectangle {...props} radius={isTop ? BAR_TOP_RADIUS : BAR_STACK_FLAT} />
}

export type MonthlyBarLayout = 'grouped' | 'stacked'

export type MonthlyEvolutionPoint = {
  period: string
  gross_revenue: number
  net_revenue: number
  gross_profit: number
  ebitda: number
  margin_pct: number
  stackEbitda: number
  stackUbOverEbitda: number
  stackNetOverUb: number
  stackGrossOverNet: number
}

type TitleLabels = {
  stackEbitda: string
  stackLayerUb: string
  stackLayerNet: string
  stackLayerGross: string
  marginPct: string
}

type MonthlyEvolutionPanelProps = {
  data: MonthlyEvolutionPoint[]
  titleLabels: TitleLabels
  barLayout: MonthlyBarLayout
  heightClassName?: string
}

type PayloadEntry = {
  dataKey?: string | number
  name?: string
  value?: number | string
  color?: string
}

function payloadValue(payload: readonly unknown[] | undefined, dataKey: string): number | undefined {
  if (!payload?.length) return undefined
  for (const raw of payload) {
    if (raw === null || typeof raw !== 'object') continue
    const o = raw as PayloadEntry
    const dk = o.dataKey
    if (typeof dk !== 'string' && typeof dk !== 'number') continue
    if (String(dk) !== dataKey) continue
    const value = o.value
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
    return Number.isNaN(num) ? undefined : num
  }
  return undefined
}

function payloadColor(payload: readonly unknown[] | undefined, dataKey: string, fallback: string): string {
  if (!payload?.length) return fallback
  for (const raw of payload) {
    if (raw === null || typeof raw !== 'object') continue
    const o = raw as PayloadEntry
    if (String(o.dataKey) !== dataKey) continue
    if (typeof o.color === 'string' && o.color) return o.color
  }
  return fallback
}

function MonthlyEvolutionTooltipContent({
  active,
  payload,
  label,
  formatCurrency,
  titleLabels,
}: {
  active?: boolean
  payload?: readonly unknown[]
  label?: unknown
  formatCurrency: (n: number) => string
  titleLabels: TitleLabels
}) {
  if (!active || !payload?.length) return null

  const swatchFallback: Record<string, string> = {
    stackEbitda: CHART_COLORS[2],
    stackUbOverEbitda: CHART_COLORS[1],
    stackNetOverUb: 'var(--chart-4)',
    stackGrossOverNet: CHART_COLORS[0],
    margin_pct: CHART_COLORS[0],
  }

  const labelFor: Record<string, string> = {
    stackEbitda: titleLabels.stackEbitda,
    stackUbOverEbitda: titleLabels.stackLayerUb,
    stackNetOverUb: titleLabels.stackLayerNet,
    stackGrossOverNet: titleLabels.stackLayerGross,
    margin_pct: titleLabels.marginPct,
  }

  const keys = ['stackEbitda', 'stackUbOverEbitda', 'stackNetOverUb', 'stackGrossOverNet', 'margin_pct'] as const

  const rows: { key: string; label: string; display: string; sortVal: number; swatch: string }[] = []

  for (const key of keys) {
    const v = payloadValue(payload, key)
    if (v === undefined) continue
    const pct = key === 'margin_pct'
    rows.push({
      key,
      label: labelFor[key],
      display: pct ? `${v.toFixed(1)}%` : formatCurrency(v),
      sortVal: v,
      swatch: payloadColor(payload, key, swatchFallback[key]),
    })
  }

  rows.sort((a, b) => b.sortVal - a.sortVal)
  const ordered = rows

  const labelText = label != null ? String(label) : ''

  return (
    <div style={{ ...tooltipContentStyle, padding: '10px 12px' }}>
      {labelText ? (
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>{labelText}</div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {ordered.map((row) => (
          <div key={row.key} className="flex justify-between gap-6 text-[12px] leading-snug">
            <span className="flex min-w-0 items-center gap-2 text-text-secondary">
              <span
                className="inline-block size-2.5 shrink-0 rounded-sm border border-white/10"
                style={{ background: row.swatch }}
                aria-hidden
              />
              {row.label}
            </span>
            <span className="tabular-nums text-text-primary">{row.display}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MonthlyEvolutionPanel({
  data,
  titleLabels,
  barLayout,
  heightClassName = 'h-[320px]',
}: MonthlyEvolutionPanelProps) {
  const { formatCurrency } = useCurrency()
  const stacked = barLayout === 'stacked'

  return (
    <div className={cn('w-full min-h-0', chartPlotSurfaceClassName, heightClassName)}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={chartMargins}>
          <CartesianGrid {...cartesianGridProps} />
          <XAxis dataKey="period" {...xAxisProps} />
          <YAxis
            {...yAxisProps}
            tickFormatter={(v) => formatCurrency(v)}
            width={56}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            {...yAxisProps}
            tickFormatter={(v) => fmtPct(v)}
            width={60}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={(props) => (
              <MonthlyEvolutionTooltipContent
                {...props}
                formatCurrency={formatCurrency}
                titleLabels={titleLabels}
              />
            )}
          />

          <Bar
            dataKey="stackEbitda"
            name={titleLabels.stackEbitda}
            stackId={stacked ? STACK_ID : undefined}
            fill={CHART_COLORS[2]}
            fillOpacity={0.92}
            radius={stacked ? undefined : BAR_TOP_RADIUS}
            shape={stacked ? monthlyStackEbitdaShape : undefined}
          />
          <Bar
            dataKey="stackUbOverEbitda"
            name={titleLabels.stackLayerUb}
            stackId={stacked ? STACK_ID : undefined}
            fill={CHART_COLORS[1]}
            fillOpacity={0.48}
            radius={stacked ? undefined : BAR_TOP_RADIUS}
            shape={stacked ? monthlyStackUbShape : undefined}
          />
          <Bar
            dataKey="stackNetOverUb"
            name={titleLabels.stackLayerNet}
            stackId={stacked ? STACK_ID : undefined}
            fill="var(--chart-4)"
            fillOpacity={0.42}
            radius={stacked ? undefined : BAR_TOP_RADIUS}
            shape={stacked ? monthlyStackNetShape : undefined}
          />
          <Bar
            dataKey="stackGrossOverNet"
            name={titleLabels.stackLayerGross}
            stackId={stacked ? STACK_ID : undefined}
            fill={CHART_COLORS[0]}
            fillOpacity={0.38}
            radius={stacked ? undefined : BAR_TOP_RADIUS}
            shape={stacked ? monthlyStackGrossOverNetShape : undefined}
          />
          <Line
            type="monotone"
            dataKey="margin_pct"
            name={titleLabels.marginPct}
            yAxisId="right"
            stroke="var(--chart-1)"
            strokeOpacity={0.98}
            strokeWidth={2.4}
            dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0, fillOpacity: 0.95 }}
            activeDot={{ r: 4.5, fill: 'var(--chart-1)' }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: 10,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
            }}
            formatter={(value) => <span className="text-text-secondary">{value}</span>}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
