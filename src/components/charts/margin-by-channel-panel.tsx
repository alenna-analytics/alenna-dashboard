import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  cartesianGridProps,
  chartMargins,
  chartPlotSurfaceClassName,
  tooltipContentStyle,
  xAxisProps,
  yAxisProps,
} from './chart-theme'

export type MarginByChannelDatum = Record<string, string | number>

export type MarginSeries = {
  key: string
  name: string
  color: string
}

type MarginByChannelPanelProps = {
  data: MarginByChannelDatum[]
  xKey: string
  series: MarginSeries[]
  heightClassName?: string
}

export function MarginByChannelPanel({
  data,
  xKey,
  series,
  heightClassName = 'h-[300px]',
}: MarginByChannelPanelProps) {
  return (
    <div className={cn('w-full min-h-0', chartPlotSurfaceClassName, heightClassName)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={chartMargins}>
          <CartesianGrid {...cartesianGridProps} />
          <XAxis dataKey={xKey} {...xAxisProps} />
          <YAxis {...yAxisProps} tickFormatter={(v) => fmtPct(v)} width={60} />
          <Tooltip
            contentStyle={{
              ...tooltipContentStyle,
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
            }}
            formatter={(value) => fmtPct(value as number)}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeOpacity={0.92}
              strokeWidth={1.5}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

