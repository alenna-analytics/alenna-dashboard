import type { PieLabelRenderProps } from 'recharts'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { CHART_COLORS } from '@/components/charts/chart-theme'
import { cn } from '@/lib/utils'

export type PieChartDatum = { name: string; value: number }

type PieChartPanelProps = {
  data: PieChartDatum[]
  /** Map legend name → hex (e.g. channel colors). */
  colorByName?: Record<string, string>
  heightClassName?: string
  className?: string
  innerRadius?: number
  outerRadius?: number
}

const INSIDE_PCT_THRESHOLD = 0.06

function formatPct(percent: number): string {
  const p = percent * 100
  return p >= 10 ? `${p.toFixed(1)}%` : `${p.toFixed(2)}%`
}

function DonutPercentLabel(props: PieLabelRenderProps) {
  const cx = Number(props.cx ?? 0)
  const cy = Number(props.cy ?? 0)
  const midAngle = Number(props.midAngle ?? 0)
  const innerR = Number(props.innerRadius ?? 0)
  const outerR = Number(props.outerRadius ?? 0)
  const percent = Number(props.percent ?? 0)
  const text = formatPct(percent)
  const RADIAN = Math.PI / 180

  if (percent >= INSIDE_PCT_THRESHOLD) {
    const r = innerR + (outerR - innerR) * 0.55
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return (
      <text
        x={x}
        y={y}
        fill="var(--text-primary)"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontFamily="var(--font-mono)"
        className="pointer-events-none"
      >
        {text}
      </text>
    )
  }

  const cos = Math.cos(-RADIAN * midAngle)
  const sin = Math.sin(-RADIAN * midAngle)
  const sx = cx + (outerR + 4) * cos
  const sy = cy + (outerR + 4) * sin
  const mx = cx + (outerR + 16) * cos
  const my = cy + (outerR + 16) * sin
  const outward = cos >= 0 ? 1 : -1
  const ex = mx + outward * 12
  const ey = my

  return (
    <g className="pointer-events-none">
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke="rgba(255,255,255,0.55)"
        fill="none"
        strokeWidth={1}
      />
      <text
        x={ex + outward * 4}
        y={ey}
        dy={4}
        textAnchor={outward > 0 ? 'start' : 'end'}
        fill="var(--text-primary)"
        fontSize={11}
        fontFamily="var(--font-mono)"
      >
        {text}
      </text>
    </g>
  )
}

export function PieChartPanel({
  data,
  colorByName,
  heightClassName = 'h-72',
  className,
  innerRadius = 58,
  outerRadius = 70,
}: PieChartPanelProps) {
  return (
    <div className={cn('w-full min-h-0', heightClassName, className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 4, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={1.5}
            label={DonutPercentLabel}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={
                  colorByName?.[entry.name] ??
                  CHART_COLORS[i % CHART_COLORS.length]
                }
                fillOpacity={0.88}
                stroke="var(--card)"
                strokeWidth={1.5}
              />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="square"
            iconSize={10}
            wrapperStyle={{
              paddingTop: 8,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}
            formatter={(value) => (
              <span className="text-text-secondary">{value}</span>
            )}
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
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
