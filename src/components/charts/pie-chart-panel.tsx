import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { CHART_COLORS } from '@/components/charts/chart-theme'
import { cn } from '@/lib/utils'

export type PieChartDatum = { name: string; value: number }

type PieChartPanelProps = {
  data: PieChartDatum[]
  heightClassName?: string
  className?: string
  innerRadius?: number
  outerRadius?: number
}

export function PieChartPanel({
  data,
  heightClassName = 'h-64',
  className,
  innerRadius = 48,
  outerRadius = 72,
}: PieChartPanelProps) {
  return (
    <div className={cn('w-full min-h-0', heightClassName, className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
