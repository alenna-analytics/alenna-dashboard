import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useCurrency } from '@/components/providers/currency-provider'
import { fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CHART_COLORS, cartesianGridProps, chartMargins, xAxisProps, yAxisProps } from './chart-theme'

const STACK_ID = 'monthly-income'

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

type MonthlyEvolutionPanelProps = {
  data: MonthlyEvolutionPoint[]
  titleLabels: {
    stackEbitda: string
    stackLayerUb: string
    stackLayerNet: string
    stackLayerGross: string
    marginPct: string
  }
  heightClassName?: string
}

export function MonthlyEvolutionPanel({
  data,
  titleLabels,
  heightClassName = 'h-[320px]',
}: MonthlyEvolutionPanelProps) {
  const { formatCurrency } = useCurrency()

  return (
    <div className={cn('w-full min-h-0', heightClassName)}>
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
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
            formatter={(value, name) => {
              if (name === titleLabels.marginPct) {
                return [fmtPct(value as number), name]
              }
              return [formatCurrency(value as number), name]
            }}
          />

          <Bar
            dataKey="stackEbitda"
            name={titleLabels.stackEbitda}
            stackId={STACK_ID}
            fill={CHART_COLORS[2]}
            fillOpacity={0.92}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="stackUbOverEbitda"
            name={titleLabels.stackLayerUb}
            stackId={STACK_ID}
            fill={CHART_COLORS[1]}
            fillOpacity={0.48}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="stackNetOverUb"
            name={titleLabels.stackLayerNet}
            stackId={STACK_ID}
            fill="var(--chart-4)"
            fillOpacity={0.42}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="stackGrossOverNet"
            name={titleLabels.stackLayerGross}
            stackId={STACK_ID}
            fill={CHART_COLORS[0]}
            fillOpacity={0.38}
            radius={[3, 3, 0, 0]}
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
            formatter={(value) => (
              <span className="text-text-secondary">{value}</span>
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
