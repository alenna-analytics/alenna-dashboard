import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  cartesianGridProps,
  CHART_COLORS,
  chartMargins,
  chartPlotSurfaceClassName,
  tooltipContentStyle,
  xAxisProps,
  yAxisProps,
} from '@/components/charts/chart-theme'
import { cn } from '@/lib/utils'

export type LineChartDatum = Record<string, string | number>

type LineChartPanelProps = {
  data: LineChartDatum[]
  dataKeyX: string
  series: { key: string; name?: string }[]
  heightClassName?: string
  className?: string
}

export function LineChartPanel({
  data,
  dataKeyX,
  series,
  heightClassName = 'h-64',
  className,
}: LineChartPanelProps) {
  return (
    <div className={cn('w-full min-h-0', chartPlotSurfaceClassName, heightClassName, className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={chartMargins}>
          <CartesianGrid {...cartesianGridProps} />
          <XAxis dataKey={dataKeyX} {...xAxisProps} />
          <YAxis {...yAxisProps} width={40} />
          <Tooltip contentStyle={tooltipContentStyle} />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name ?? s.key}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
