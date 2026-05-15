import { useMemo } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TopProductRow } from '@/lib/types/reports'

import {
  TOP_PRODUCTS_BAR_ROW_PX,
  TOP_PRODUCTS_SCROLL_VISIBLE_ROWS,
} from './home-top-products-chart-layout'

export type HomeTopProductsChartProps = {
  rows: TopProductRow[]
  convertValue: (value: number) => number
  formatValue: (value: number) => string
  formatCompact: (value: number) => string
  t: (key: ShellStringKey) => string
}

type BarRow = {
  productId: string
  title: string
  revenue: number
}

const scrollMaxHeightPx = TOP_PRODUCTS_SCROLL_VISIBLE_ROWS * TOP_PRODUCTS_BAR_ROW_PX

function TopProductChartRow({
  row,
  widthPct,
  formatCompact,
}: {
  row: BarRow
  widthPct: number
  formatCompact: (value: number) => string
}) {
  return (
    <li className="flex min-h-0" style={{ minHeight: TOP_PRODUCTS_BAR_ROW_PX }}>
      <div className="flex w-full flex-1 flex-col justify-center rounded-md px-1 py-2">
        <p className="mb-1 truncate text-xs text-text-secondary" title={row.title}>
          {row.title}
        </p>
        <div className="flex min-h-4.5 items-center gap-2.5">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/55">
            <div
              className="h-full min-w-px rounded-r-full bg-[var(--country-green-base)]"
              style={{ width: `${widthPct}%` }}
              aria-hidden
            />
          </div>
          <span className="font-numeric shrink-0 text-xs tabular-nums text-text-secondary">
            {formatCompact(row.revenue)}
          </span>
        </div>
      </div>
    </li>
  )
}

export function HomeTopProductsChart({
  rows,
  convertValue,
  formatCompact,
  t,
}: HomeTopProductsChartProps) {
  const data = useMemo<BarRow[]>(
    () =>
      rows
        .map((r) => ({
          productId: r.product_id,
          title: r.title,
          revenue: convertValue(r.gross_revenue),
        }))
        .filter((r) => r.revenue > 0),
    [rows, convertValue],
  )

  const maxRevenue = useMemo(() => Math.max(...data.map((r) => r.revenue), 1), [data])

  if (data.length === 0) {
    return (
      <p className="rounded-md px-2 py-10 text-center text-sm text-text-secondary">
        {t('homeTopProductsEmpty')}
      </p>
    )
  }

  return (
    <div
      className="w-full overflow-x-hidden overflow-y-auto pr-0.5 [scrollbar-gutter:stable]"
      style={{ maxHeight: scrollMaxHeightPx }}
    >
      <ul className="w-full">
        {data.map((row, index) => {
          const widthPct = maxRevenue > 0 ? (row.revenue / maxRevenue) * 100 : 0

          return (
            <TopProductChartRow
              key={`${row.productId}-${index}`}
              row={row}
              widthPct={widthPct}
              formatCompact={formatCompact}
            />
          )
        })}
      </ul>
    </div>
  )
}
