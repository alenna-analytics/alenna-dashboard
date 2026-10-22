import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { formatCompactNumber } from '@/lib/format/compact-number'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { settingsSectionTitleClassName } from '@/pages/configuration/settings-layout'
import type { MonthlyRevenueMonthRow } from '@/lib/types/reports'
import { ChartTooltipFrame, ChartTooltipSeriesRow, ChartTooltipTitle, chartRechartsTooltipProps } from '@/ui/chart-tooltip'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'

import { buildWeeklyNetSalesBars, type WeeklyNetSalesBar } from './group-weekly-sales'

type ShellT = (key: ShellStringKey) => string

const COMPLETE_FILL = 'var(--country-green-base)'
const INCOMPLETE_FILL = 'color-mix(in srgb, var(--country-green-base) 28%, white)'

type WeekTickProps = {
  x?: number
  y?: number
  index?: number
  payload?: { value?: string; index?: number }
  bars: WeeklyNetSalesBar[]
  unitSuffix: string
}

function WeekTick({ x = 0, y = 0, index, payload, bars, unitSuffix }: WeekTickProps) {
  const bar = bars[payload?.index ?? index ?? -1]
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="var(--text-tertiary)" fontSize={11} dy={12}>
        {payload?.value}
      </text>
      <text textAnchor="middle" fill="var(--text-tertiary)" fontSize={11} dy={26}>
        {bar ? `${bar.units.toLocaleString()} ${unitSuffix}` : ''}
      </text>
    </g>
  )
}

function WeeklyTooltip({
  active,
  payload,
  formatMoney,
  t,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: WeeklyNetSalesBar }>
  formatMoney: (value: number) => string
  t: ShellT
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <ChartTooltipFrame>
      <ChartTooltipTitle>
        {row.weekLabel}
        {row.incomplete ? ` · ${t('productsGroupAnalyticsWeeklyIncompleteTip')}` : ''}
      </ChartTooltipTitle>
      <div className="space-y-1.5">
        <ChartTooltipSeriesRow
          color={row.incomplete ? INCOMPLETE_FILL : COMPLETE_FILL}
          label={t('productsGroupAnalyticsWeeklyTitle')}
          value={formatMoney(row.netSales)}
        />
        <ChartTooltipSeriesRow
          color={row.incomplete ? INCOMPLETE_FILL : COMPLETE_FILL}
          label={t('productsGroupAnalyticsWeeklyUnits')}
          value={`${row.units.toLocaleString()} ${t('productsGroupAnalyticsUnitSuffix')}`}
        />
      </div>
    </ChartTooltipFrame>
  )
}

export function GroupWeeklyNetSalesChart({
  rows,
  start,
  end,
  lang,
  today,
  formatMoney,
  t,
  isLoading,
  isError,
}: {
  rows: MonthlyRevenueMonthRow[]
  start: string
  end: string
  lang: string
  today: Date
  formatMoney: (value: number) => string
  t: ShellT
  isLoading: boolean
  isError: boolean
}) {
  const bars = useMemo(
    () => buildWeeklyNetSalesBars(rows, start, end, lang, today),
    [end, lang, rows, start, today],
  )
  const unitSuffix = t('productsGroupAnalyticsUnitSuffix')

  return (
    <section className="mt-6 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className={settingsSectionTitleClassName}>{t('productsGroupAnalyticsWeeklyTitle')}</h2>
        <p className="text-xs text-text-tertiary">{t('productsGroupAnalyticsWeeklyIncomplete')}</p>
      </div>
      {isLoading && bars.length === 0 ? (
        <Skeleton className="h-72 w-full" aria-hidden />
      ) : isError ? (
        <p className="text-sm text-destructive">{t('reportsMonthlyLoadError')}</p>
      ) : bars.length === 0 ? (
        <EmptyState size="sm" icon="channels" title={t('reportsNoData')} />
      ) : (
        <div className="w-full overflow-x-auto">
          <div className="h-80" style={{ minWidth: Math.max(bars.length * 72, 320) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 28, right: 8, bottom: 8, left: 0 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis
                dataKey="weekLabel"
                tickLine={false}
                axisLine={false}
                interval={0}
                height={42}
                tick={<WeekTick bars={bars} unitSuffix={unitSuffix} />}
              />
              <YAxis
                width={48}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                tickFormatter={(value: number) => formatCompactNumber(Number(value), 0)}
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.35 }}
                content={<WeeklyTooltip formatMoney={formatMoney} t={t} />}
                {...chartRechartsTooltipProps}
              />
              <Bar
                dataKey="netSales"
                radius={[6, 6, 0, 0]}
                maxBarSize={56}
                isAnimationActive={false}
                label={{
                  position: 'top',
                  fill: 'var(--text-primary)',
                  fontSize: 11,
                  fontWeight: 600,
                  formatter: (value: unknown) => formatCompactNumber(Number(value) || 0, 0),
                }}
              >
                {bars.map((bar) => (
                  <Cell key={bar.weekStart} fill={bar.incomplete ? INCOMPLETE_FILL : COMPLETE_FILL} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  )
}
