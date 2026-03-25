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

import { fmtCurrency, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CHART_COLORS, cartesianGridProps, chartMargins, xAxisProps, yAxisProps } from './chart-theme'

export type MonthlyEvolutionPoint = {
  period: string
  gross_revenue: number
  net_revenue: number
  gross_profit: number
  ebitda: number
  margin_pct: number
}

type MonthlyEvolutionPanelProps = {
  data: MonthlyEvolutionPoint[]
  titleLabels: {
    grossRevenue: string
    netRevenue: string
    grossProfit: string
    ebitda: string
    marginPct: string
  }
  heightClassName?: string
}

export function MonthlyEvolutionPanel({
  data,
  titleLabels,
  heightClassName = 'h-[320px]',
}: MonthlyEvolutionPanelProps) {
  return (
    <div className={cn('w-full min-h-0', heightClassName)}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={chartMargins}>
          <CartesianGrid {...cartesianGridProps} />
          <XAxis dataKey="period" {...xAxisProps} />
          <YAxis
            {...yAxisProps}
            tickFormatter={(v) => fmtCurrency(v)}
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
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
            formatter={(value) => fmtCurrency(value as number)}
          />

          <Bar
            dataKey="gross_revenue"
            name={titleLabels.grossRevenue}
            fill={CHART_COLORS[0]}
            fillOpacity={0.55}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="net_revenue"
            name={titleLabels.netRevenue}
            fill={CHART_COLORS[0]}
            fillOpacity={0.85}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="gross_profit"
            name={titleLabels.grossProfit}
            fill={CHART_COLORS[1]}
            fillOpacity={0.72}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="ebitda"
            name={titleLabels.ebitda}
            fill={CHART_COLORS[2]}
            fillOpacity={0.65}
            radius={[3, 3, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="margin_pct"
            name={titleLabels.marginPct}
            yAxisId="right"
            stroke="var(--chart-line-secondary)"
            strokeWidth={1.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

