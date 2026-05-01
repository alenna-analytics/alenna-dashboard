/* eslint-disable react-refresh/only-export-components -- mergeMonthlyRows shared with dashboard trend chart */
import { useState } from 'react'
import { eachMonthOfInterval, endOfMonth, format, startOfMonth } from 'date-fns'
import type { Locale } from 'date-fns'
import type { BarShapeProps } from 'recharts'
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

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { MonthlyRevenueMonthRow } from '@/lib/types/reports'
import { cn } from '@/lib/utils'

import { parseLocalYmd } from './reports-ui-helpers'

export type MonthlyChartRow = {
  label: string
  gross_revenue: number
  net_revenue: number
  gross_profit: number
  gross_margin_pct: number
}

type LayerKey = 'bruto' | 'neta' | 'utilidad' | 'margin'

type EvolutionMetric = 'revenue' | 'profit' | 'orders'

const CHART_MONTHLY_GROSS_BAR = 'var(--chart-monthly-gross-bar)'

function toNum(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

export function mergeMonthlyRows(
  startYmd: string,
  endYmd: string,
  rows: MonthlyRevenueMonthRow[],
  locale: Locale,
): MonthlyChartRow[] {
  const d0 = parseLocalYmd(startYmd)
  const d1 = parseLocalYmd(endYmd)
  const lo = d0 <= d1 ? d0 : d1
  const hi = d0 <= d1 ? d1 : d0
  const intervalStart = startOfMonth(lo)
  const intervalEnd = endOfMonth(hi)
  const months = eachMonthOfInterval({ start: intervalStart, end: intervalEnd })
  const byYm = new Map<string, MonthlyRevenueMonthRow>()
  for (const m of rows) {
    const key = m.month_start.slice(0, 7)
    byYm.set(key, m)
  }

  return months.map((d) => {
    const key = format(d, 'yyyy-MM')
    const p = byYm.get(key)
    return {
      label: format(d, 'MMM yyyy', { locale }),
      gross_revenue: toNum(p?.gross_revenue),
      net_revenue: toNum(p?.net_revenue),
      gross_profit: toNum(p?.gross_profit),
      gross_margin_pct: toNum(p?.gross_margin_pct),
    }
  })
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

/** Same three KPIs (bruto, neta, utilidad): same bar width, overlapped from one baseline (front draws on top). */
function OverlappingKpiBarShape(
  props: BarShapeProps,
  hidden: Partial<Record<'bruto' | 'neta' | 'utilidad', boolean>>,
) {
  const { x, y, width, height, payload } = props
  if (x == null || y == null || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null
  }
  const row = payload as MonthlyChartRow | undefined
  if (!row) return null

  const gross = toNum(row.gross_revenue)
  const netRaw = toNum(row.net_revenue)
  const profRaw = toNum(row.gross_profit)
  const net = Math.min(netRaw, gross)
  const profit = Math.min(profRaw, net, gross)

  const bottom = y + height
  const hNet = gross > 0 ? height * (net / gross) : 0
  const hProfit = gross > 0 ? height * (profit / gross) : 0

  const yTopNet = bottom - hNet
  const yTopProfit = bottom - hProfit

  const r = 8

  return (
    <g>
      {!hidden.bruto && gross > 0 && height > 0.5 && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={r}
          ry={r}
          fill={CHART_MONTHLY_GROSS_BAR}
          fillOpacity={0.82}
        />
      )}
      {!hidden.neta && hNet > 0.5 && (
        <rect
          x={x}
          y={yTopNet}
          width={width}
          height={hNet}
          rx={r}
          ry={r}
          fill="var(--chart-3)"
          fillOpacity={0.58}
          stroke="var(--chart-3)"
          strokeOpacity={0.22}
          strokeWidth={0.5}
        />
      )}
      {!hidden.utilidad && hProfit > 0.5 && (
        <rect
          x={x}
          y={yTopProfit}
          width={width}
          height={hProfit}
          rx={r}
          ry={r}
          fill="var(--chart-4)"
          fillOpacity={0.68}
        />
      )}
    </g>
  )
}

function ChartTooltip({
  active,
  payload,
  currency,
  t,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: MonthlyChartRow }>
  currency: string
  t: (k: ShellStringKey) => string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as MonthlyChartRow | undefined
  if (!row) return null
  const gross = toNum(row.gross_revenue)
  const net = toNum(row.net_revenue)
  const profit = toNum(row.gross_profit)
  return (
    <div className="rounded-xl border border-border-default bg-background px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      <p className="mb-2 font-medium text-text-primary">{row.label}</p>
      <div className="space-y-1 tabular-nums text-text-secondary">
        <div className="flex justify-between gap-6">
          <span>{t('reportsGrossRevenue')}</span>
          <span className="font-medium text-text-primary">{fmtMoneyCompact(gross, currency)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span>{t('reportsNetRevenue')}</span>
          <span className="font-medium text-text-primary">{fmtMoneyCompact(net, currency)}</span>
        </div>
        <div className="flex justify-between gap-6 border-t border-border-default/60 pt-1">
          <span>{t('reportsGrossProfit')}</span>
          <span className="font-medium text-text-primary">{fmtMoneyCompact(profit, currency)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span>{t('reportsMonthlyLegendGrossMarginPct')}</span>
          <span className="font-medium text-text-primary">
            {toNum(row.gross_margin_pct).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function EvolutionMetricToggle({
  active,
  onSelect,
  t,
}: {
  active: EvolutionMetric
  onSelect: (m: EvolutionMetric) => void
  t: (k: ShellStringKey) => string
}) {
  const opts: { id: EvolutionMetric; label: ShellStringKey }[] = [
    { id: 'revenue', label: 'reportsEvolutionToggleRevenue' },
    { id: 'profit', label: 'reportsEvolutionToggleProfit' },
    { id: 'orders', label: 'reportsEvolutionToggleOrders' },
  ]
  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-2"
      role="tablist"
    >
      {opts.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          onClick={() => onSelect(id)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
            active === id
              ? 'border-brand bg-brand-dim text-brand shadow-[var(--shadow-ink-xs)]'
              : 'border-border-default bg-bg-elevated/90 text-text-secondary hover:border-border-emphasis hover:text-text-primary',
          )}
        >
          {t(label)}
        </button>
      ))}
    </div>
  )
}

function ChartLegendToggle({
  t,
  hidden,
  onToggle,
}: {
  t: (k: ShellStringKey) => string
  hidden: Partial<Record<LayerKey, boolean>>
  onToggle: (key: LayerKey) => void
}) {
  const items: {
    key: LayerKey
    label: ShellStringKey
    swatchClass?: string
    isLine?: boolean
  }[] = [
    { key: 'bruto', label: 'reportsGrossRevenue', swatchClass: 'bg-[var(--chart-monthly-gross-bar)]' },
    { key: 'neta', label: 'reportsNetRevenue', swatchClass: 'bg-[var(--chart-3)]' },
    { key: 'utilidad', label: 'reportsGrossProfit', swatchClass: 'bg-[var(--chart-4)]' },
    { key: 'margin', label: 'reportsMonthlyLegendGrossMarginPct', isLine: true },
  ]

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px]">
      {items.map((item) => {
        const isOff = Boolean(hidden[item.key])
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onToggle(item.key)}
            aria-pressed={isOff}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-transparent px-2 py-1 transition-opacity',
              isOff && 'opacity-45',
              !isOff && 'hover:border-border-subtle hover:bg-bg-elevated/80',
            )}
          >
            {item.isLine ? (
              <svg width={28} height={10} aria-hidden className="shrink-0">
                <line
                  x1={2}
                  y1={5}
                  x2={26}
                  y2={5}
                  stroke="var(--warning)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
                <circle
                  cx={14}
                  cy={5}
                  r={4}
                  fill="var(--primary-foreground)"
                  stroke="var(--warning)"
                  strokeWidth={1.5}
                />
              </svg>
            ) : (
              <span className={cn('size-2.5 shrink-0 rounded-sm', item.swatchClass)} aria-hidden />
            )}
            <span
              className={cn('text-text-secondary', isOff && 'line-through decoration-text-tertiary')}
            >
              {t(item.label)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

type MonthlyRevenueChartProps = {
  startDate: string
  endDate: string
  rows: MonthlyRevenueMonthRow[]
  currency: string
  dateLocale: Locale
  t: (k: ShellStringKey) => string
}

export function MonthlyRevenueChart({
  startDate,
  endDate,
  rows,
  currency,
  dateLocale,
  t,
}: MonthlyRevenueChartProps) {
  const chartData = mergeMonthlyRows(startDate, endDate, rows, dateLocale)
  const [hidden, setHidden] = useState<Partial<Record<LayerKey, boolean>>>({})
  const [evolutionMetric, setEvolutionMetric] = useState<EvolutionMetric>('revenue')

  const toggle = (key: LayerKey) => {
    setHidden((h) => ({ ...h, [key]: !h[key] }))
  }

  const shapeFn = (props: BarShapeProps) =>
    OverlappingKpiBarShape(props, {
      bruto: hidden.bruto,
      neta: hidden.neta,
      utilidad: hidden.utilidad,
    })

  return (
    <div className="w-full">
      <EvolutionMetricToggle active={evolutionMetric} onSelect={setEvolutionMetric} t={t} />
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border-default)' }}
            tickLine={false}
            interval={chartData.length > 14 ? 'preserveStartEnd' : 0}
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
            content={<ChartTooltip currency={currency} t={t} />}
            wrapperStyle={{ outline: 'none' }}
            contentStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              boxShadow: 'none',
              backdropFilter: 'none',
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="gross_revenue"
            shape={shapeFn}
            fill={CHART_MONTHLY_GROSS_BAR}
            radius={[8, 8, 8, 8]}
            isAnimationActive={false}
          />
          {!hidden.margin ? (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="gross_margin_pct"
              stroke="var(--warning)"
              strokeWidth={3.5}
              strokeDasharray="6 4"
              dot={{
                r: 5,
                fill: 'var(--primary-foreground)',
                stroke: 'var(--warning)',
                strokeWidth: 2,
              }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
      <ChartLegendToggle t={t} hidden={hidden} onToggle={toggle} />
    </div>
  )
}
