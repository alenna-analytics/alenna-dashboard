import { useMemo } from 'react'

import type { Locale } from 'date-fns'
import type { MonthlyRevenueMonthRow } from '@/lib/types/reports'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { mergeMonthlyRows } from '@/pages/reports/monthly-revenue-chart'
import { fmtCurrency } from '@/pages/reports/reports-ui-helpers'

export type DashboardRevenueTrendChartProps = {
  startDate: string
  endDate: string
  prevStart: string
  prevEnd: string
  rowsCurrent: MonthlyRevenueMonthRow[]
  rowsPrev: MonthlyRevenueMonthRow[]
  comparePrevious: boolean
  currency: string
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
  rowsCurrent: MonthlyRevenueMonthRow[],
  rowsPrev: MonthlyRevenueMonthRow[],
  locale: Locale,
  comparePrevious: boolean,
): TrendRow[] {
  const cur = mergeMonthlyRows(startDate, endDate, rowsCurrent, locale)
  if (!comparePrevious) {
    return cur.map((c) => ({
      label: c.label,
      current: c.net_revenue,
      previous: null,
      previousBucketLabel: null,
    }))
  }
  const prev = mergeMonthlyRows(prevStart, prevEnd, rowsPrev, locale)
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
  currency,
  comparePrevious,
  t,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: TrendRow }>
  currency: string
  comparePrevious: boolean
  t: (key: ShellStringKey) => string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as TrendRow | undefined
  if (!row) return null
  return (
    <div className="rounded-xl border border-border-default bg-background px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      <div className="space-y-1.5 leading-snug">
        <p className="tabular-nums">
          <span className="text-text-tertiary">
            {t('dashboardRevenueSeriesCurrent')} ({row.label}):
          </span>{' '}
          <span className="font-medium text-text-primary">{fmtCurrency(row.current, currency)}</span>
        </p>
        {comparePrevious && row.previous !== null && row.previousBucketLabel ? (
          <p className="tabular-nums">
            <span className="text-text-tertiary">
              {t('dashboardRevenueSeriesPrevious')} ({row.previousBucketLabel}):
            </span>{' '}
            <span className="font-medium text-text-primary">{fmtCurrency(row.previous, currency)}</span>
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
  rowsCurrent,
  rowsPrev,
  comparePrevious,
  currency,
  dateLocale,
  t,
}: DashboardRevenueTrendChartProps) {
  const data = useMemo(
    () =>
      buildTrendRows(
        startDate,
        endDate,
        prevStart,
        prevEnd,
        rowsCurrent,
        rowsPrev,
        dateLocale,
        comparePrevious,
      ),
    [startDate, endDate, prevStart, prevEnd, rowsCurrent, rowsPrev, dateLocale, comparePrevious],
  )

  return (
    <div className="w-full min-w-0">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border-default)' }}
            tickLine={false}
            interval={data.length > 12 ? 'preserveStartEnd' : 0}
          />
          <YAxis
            tickFormatter={(v) => fmtMoneyCompact(Number(v), currency)}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<TrendTooltip currency={currency} comparePrevious={comparePrevious} t={t} />}
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
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => <span className="text-text-secondary">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="current"
            name={t('dashboardRevenueSeriesCurrent')}
            stroke="var(--chart-3)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'var(--chart-3)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
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
              isAnimationActive={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
