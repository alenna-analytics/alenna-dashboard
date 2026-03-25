import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  cartesianGridProps,
  CHART_COLORS,
  chartMargins,
  tooltipContentStyle,
  xAxisProps,
  yAxisProps,
} from '@/components/charts/chart-theme'
import { cn } from '@/lib/utils'

export type BarChartDatum = Record<string, string | number>

type BarChartPanelProps = {
  data: BarChartDatum[]
  dataKeyX: string
  bars: { key: string; name?: string; stackId?: string }[]
  heightClassName?: string
  className?: string
}

export function BarChartPanel({
  data,
  dataKeyX,
  bars,
  heightClassName = 'h-64',
  className,
}: BarChartPanelProps) {
  return (
    <div className={cn('w-full min-h-0', heightClassName, className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={chartMargins}>
          <CartesianGrid {...cartesianGridProps} />
          <XAxis dataKey={dataKeyX} {...xAxisProps} />
          <YAxis {...yAxisProps} width={40} />
          <Tooltip
            contentStyle={tooltipContentStyle}
            cursor={{ fill: 'transparent' }}
          />
          {bars.map((b, i) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name ?? b.key}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              stackId={b.stackId}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
