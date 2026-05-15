import { useMemo } from 'react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TopProductRow } from '@/lib/types/reports'

import {
  TOP_PRODUCTS_AXIS_PX,
  TOP_PRODUCTS_BAR_ROW_PX,
} from './home-top-products-chart-layout'

const BAR_FILL = 'var(--chart-1)'

const ROW_HEIGHT = TOP_PRODUCTS_BAR_ROW_PX
const AXIS_HEIGHT = TOP_PRODUCTS_AXIS_PX

export type HomeTopProductsChartProps = {
  rows: TopProductRow[]
  /** Convert a base-currency amount to display currency. */
  convertValue: (value: number) => number
  /** Format a value (already in display currency) for axis ticks/tooltips. */
  formatValue: (value: number) => string
  formatCompact: (value: number) => string
  t: (key: ShellStringKey) => string
}

type BarRow = {
  productId: string
  title: string
  units: number
  revenue: number
}

/**
 * Horizontal bar chart of the top products by gross revenue, with
 * thumbnails in a left-side legend so the chart itself stays compact.
 *
 * Layout choice (legend column + chart column) over Recharts' built-in
 * tick formatter avoids stretching the YAxis with image URLs and lets
 * us use real `<img>` tags (alt text, fallbacks) instead of SVG `<image>`.
 */
export function HomeTopProductsChart({
  rows,
  convertValue,
  formatValue,
  formatCompact,
  t,
}: HomeTopProductsChartProps) {
  const getChartHeight = (rowCount: number) => rowCount * ROW_HEIGHT + AXIS_HEIGHT

  const data = useMemo<BarRow[]>(
    () =>
      rows
        .map((r) => ({
          productId: r.product_id,
          title: r.title,
          units: r.units_sold,
          revenue: convertValue(r.gross_revenue),
        }))
        .filter((r) => r.revenue > 0),
    [rows, convertValue],
  )

  if (data.length === 0) {
    return (
      <p className="rounded-md px-2 py-10 text-center text-sm text-text-secondary">
        {t('homeTopProductsEmpty')}
      </p>
    )
  }

  return (
    <div className="grid w-full grid-cols-1 gap-0 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <ul
        className="hidden flex-col lg:flex"
        style={{
          height: `${getChartHeight(data.length)}px`,
          paddingBottom: `${AXIS_HEIGHT}px`,
        }}
      >
        {data.map((r) => (
          <li
            key={r.productId}
            className="flex items-center text-xs text-text-primary"
            style={{ height: `${ROW_HEIGHT}px` }}
          >
            <span className="min-w-0 flex-1 truncate" title={r.title}>
              {r.title}
            </span>
          </li>
        ))}
      </ul>
      <div style={{ height: `${getChartHeight(data.length)}px` }}>
        <ResponsiveContainer width="100%" height={getChartHeight(data.length)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--chart-grid)"
              strokeDasharray="2 4"
            />
            <XAxis
              type="number"
              height={AXIS_HEIGHT}
              tickFormatter={formatCompact}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="productId"
              hide
              width={0}
            />
            <Tooltip
              cursor={{ fill: 'var(--chart-wf-cursor-fill)' }}
              formatter={(value, _name, payload) => {
                const row = payload?.payload as BarRow | undefined
                const numericValue = typeof value === 'number' ? value : Number(value ?? 0)
                const unitsLabel = row
                  ? t('homeTopProductsTooltipUnits').replace(
                    '{units}',
                    row.units.toLocaleString(),
                  )
                  : ''
                return [
                  `${formatValue(numericValue)}${unitsLabel ? ` · ${unitsLabel}` : ''}`,
                  '',
                ]
              }}
              labelFormatter={(_label, payload) => {
                const row = payload?.[0]?.payload as BarRow | undefined
                return row?.title ?? ''
              }}
              contentStyle={{
                background: 'var(--bg-default, #fff)',
                border: '1px solid var(--shell-structure-border)',
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Bar dataKey="revenue" radius={[0, 3, 3, 0]} barSize={16}>
              {data.map((r) => (
                <Cell key={r.productId} fill={BAR_FILL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
