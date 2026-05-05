import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import { fmtCurrency } from '@/pages/reports/reports-ui-helpers'

import type { ProductCostChartPoint } from './product-cost-chart-points'

const STROKE = 'var(--color-chart-1)'
const GRID = 'var(--color-chart-grid)'
const TICK_STYLE = { fill: 'var(--color-text-tertiary)', fontSize: 11, fontFamily: 'var(--font-numeric)' }

function ChartTooltip({
  active,
  payload,
  t,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ProductCostChartPoint }>
  t: (key: ShellStringKey) => string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="rounded-md border border-border-subtle bg-popover px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      <div className="font-medium text-text-primary">
        {t('productsDetailChartTooltipDate')}:{' '}
        <span className="font-numeric tabular-nums">{row.dateKey}</span>
      </div>
      <div className="mt-0.5 text-text-secondary">
        {t('productsDetailChartTooltipCost')}:{' '}
        <span className="font-numeric tabular-nums">{fmtCurrency(row.cost, row.currency)}</span>
      </div>
    </div>
  )
}

export type ProductCostOverTimeChartProps = {
  data: ProductCostChartPoint[]
  className?: string
  t: (key: ShellStringKey) => string
}

export function ProductCostOverTimeChart({ data, className, t }: ProductCostOverTimeChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-[14rem] items-center justify-center rounded-md border border-dashed border-border-subtle bg-muted/30 px-4 text-center text-sm text-text-secondary',
          className,
        )}
      >
        {t('productsDetailChartEmpty')}
      </div>
    )
  }

  return (
    <div className={cn('min-h-[14rem] w-full', className)}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="dateKey"
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border-subtle)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            width={56}
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border-subtle)' }}
            tickFormatter={(v) =>
              typeof v === 'number' && Number.isFinite(v)
                ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v)
                : ''
            }
          />
          <Tooltip content={<ChartTooltip t={t} />} cursor={{ stroke: 'var(--color-border-default)' }} />
          <Line
            type="stepAfter"
            dataKey="cost"
            stroke={STROKE}
            strokeWidth={2}
            dot={{ r: 3, fill: STROKE, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
